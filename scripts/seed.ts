import { PrismaClient, type GradeCategorie } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

interface GradeDef {
  libelle: string;
  categorie: GradeCategorie;
  ageDepartRetraite: number;
  ordre: number;
}

// Limites d'âge officielles (Jeu de données) appliquées aux grades de la Marine.
const GRADES: GradeDef[] = [
  // Officiers généraux (61 ans)
  { libelle: 'Vice Amiral d\'escadre', categorie: 'OFFICIER_GENERAL', ageDepartRetraite: 61, ordre: 10 },
  { libelle: 'Vice Amiral', categorie: 'OFFICIER_GENERAL', ageDepartRetraite: 61, ordre: 9 },
  { libelle: 'Contre-Amiral', categorie: 'OFFICIER_GENERAL', ageDepartRetraite: 61, ordre: 8 },
  // Officiers supérieurs (58 ans)
  { libelle: 'Capitaine de Vaisseau', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 58, ordre: 7 },
  { libelle: 'Capitaine de Frégate', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 58, ordre: 6 },
  { libelle: 'Capitaine de Corvette', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 58, ordre: 5 },
  // Officiers subalternes (55 ans)
  { libelle: 'Lieutenant de Vaisseau', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 55, ordre: 4 },
  { libelle: 'Enseigne de Vaisseau de 1re classe', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 55, ordre: 3 },
  { libelle: 'Enseigne de Vaisseau de 2e classe', categorie: 'OFFICIER_MARINE', ageDepartRetraite: 55, ordre: 2 },
  // Sous-officiers (55 / 52 ans)
  { libelle: 'Maître Principal', categorie: 'OFFICIER_MARINIER', ageDepartRetraite: 55, ordre: 15 },
  { libelle: 'Premier Maître', categorie: 'OFFICIER_MARINIER', ageDepartRetraite: 55, ordre: 14 },
  { libelle: 'Maître', categorie: 'OFFICIER_MARINIER', ageDepartRetraite: 55, ordre: 13 },
  { libelle: 'Second Maître de 1re classe', categorie: 'OFFICIER_MARINIER', ageDepartRetraite: 52, ordre: 12 },
  { libelle: 'Second Maître de 2e classe', categorie: 'OFFICIER_MARINIER', ageDepartRetraite: 52, ordre: 11 },
  // Militaires du rang / quartiers-maîtres (45 ans)
  { libelle: 'Quartier-Maître de 1re classe', categorie: 'QMO', ageDepartRetraite: 45, ordre: 25 },
  { libelle: 'Quartier-Maître de 2e classe', categorie: 'QMO', ageDepartRetraite: 45, ordre: 24 },
  { libelle: 'Matelot de 1re classe', categorie: 'QMO', ageDepartRetraite: 45, ordre: 23 },
  { libelle: 'Matelot de 2e classe', categorie: 'QMO', ageDepartRetraite: 45, ordre: 22 },
];

const SPECIALITES = [
  'Navigation maritime',
  'Conduite navale',
  'Machinerie navale',
  'Électrotechnique',
  'Électronique embarquée',
  'Armement',
  'Artillerie navale',
  'Commissariat de la flotte',
  'Transmissions',
  'Soutien santé (infirmier)',
  'Plongée',
  'Maistrance / Service général',
  'Écoute et renseignement',
  'Météorologie océanique',
];

async function main(): Promise<void> {
  console.log('Nettoyage de la base…');
  await prisma.$transaction([
    prisma.entreeAudit.deleteMany(),
    prisma.demandeModification.deleteMany(),
    prisma.ligneImport.deleteMany(),
    prisma.importPersonnel.deleteMany(),
    prisma.versionPieceJointe.deleteMany(),
    prisma.pieceJointe.deleteMany(),
    prisma.compteUtilisateur.deleteMany(),
    prisma.affectation.deleteMany(),
    prisma.historiqueGrade.deleteMany(),
    prisma.cursusScolaire.deleteMany(),
    prisma.stageMilitaire.deleteMany(),
    prisma.competenceLinguistique.deleteMany(),
    prisma.decoration.deleteMany(),
    prisma.enfant.deleteMany(),
    prisma.personnel.deleteMany(),
    prisma.specialite.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.unite.deleteMany(),
    prisma.base.deleteMany(),
  ]);

  console.log('Création des référentiels…');
  const grades = new Map<string, { id: string; categorie: GradeCategorie; ageDepartRetraite: number }>();
  for (const g of GRADES) {
    const cree = await prisma.grade.create({ data: g });
    grades.set(g.libelle, cree);
  }

  const specialites = new Map<string, { id: string }>();
  for (const s of SPECIALITES) {
    const cree = await prisma.specialite.create({ data: { libelle: s } });
    specialites.set(s, cree);
  }

  const baseEmmn = await prisma.base.create({
    data: { nom: 'Emmn — Élement de la Marine Nationale Malgache', ville: 'Antananarivo', code: 'EMMN', ordre: 1 },
  });
  const baseBana = await prisma.base.create({
    data: { nom: 'Base navale Antsiranana', ville: 'Antsiranana', code: 'BANA', ordre: 2 },
  });
  const baseBima = await prisma.base.create({
    data: {
      nom: '2e BIMA — 2e Bataillon d\'Infanterie de la Marine',
      ville: 'Antsiranana',
      code: 'BIMA',
      ordre: 3,
    },
  });

  const uniteEmmn = await prisma.unite.create({
    data: { nom: 'Emmn — Élement de la Marine (siège)', code: 'EEMM', ordre: 1, baseId: baseEmmn.id },
  });
  const uniteBana = await prisma.unite.create({
    data: { nom: 'Emmn — Base navale Antsiranana', code: 'UBAN', ordre: 1, baseId: baseBana.id },
  });
  const uniteErren = await prisma.unite.create({
    data: { nom: 'EREN', code: 'EREN', ordre: 2, baseId: baseBana.id },
  });

  // CDC §2.1 : unités du 2ème BIMA (Antsiranana).
  const unitesBima = [
    ['CCS', 'CCS'],
    ['CIMA1', '1er CIMA'],
    ['CIMA2', '2e CIMA'],
    ['CIMA3', '3e CIMA'],
    ['CCMA', 'CCMA'],
  ];
  for (const [i, [code, nom]] of unitesBima.entries()) {
    await prisma.unite.create({ data: { nom, code, ordre: 40 + i, baseId: baseBima.id } });
  }

  const unitesNavigantes = ['RC Trozona', 'PC Tselatra', 'PC Malaky', 'Direction du Port Militaire'];
  const unitesTerre = ['Unité Marine', 'CPS'];
  const detachements = [
    ['DNMG', 'Détachement Marine Mahajanga'],
    ['DNNB', 'Détachement Marine Nosy Be'],
    ['DNSM', 'Détachement Marine Sainte-Marie'],
    ['DNTL', 'Détachement Marine Toliara'],
    ['DNFD', 'Détachement Marine Fort-Dauphin'],
    ['DNMK', 'Détachement Marine Manakara'],
  ];

  for (const [i, nom] of unitesNavigantes.entries()) {
    await prisma.unite.create({ data: { nom, code: `UN${i + 1}`, ordre: 10 + i, baseId: baseBana.id } });
  }
  for (const [i, nom] of unitesTerre.entries()) {
    await prisma.unite.create({ data: { nom, code: `UT${i + 1}`, ordre: 20 + i, baseId: baseBana.id } });
  }
  let di = 0;
  for (const [code, nom] of detachements) {
    di += 1;
    await prisma.unite.create({ data: { nom, code, ordre: 30 + di, baseId: baseBana.id } });
  }

  const personnelList = [
    { mat: 'MSA/2010/045', nom: 'RAZAFINDRAKOTO', prenoms: 'Jules Henri', age: 42, sx: 'M', grade: 'Lieutenant de Vaisseau', unite: uniteEmmn, spe: 'Navigation maritime', sitFamiliale: 'Marié(e)', email: 'j.razafindrakoto@marines.mg', tel: '+261 34 000 000 01', corps: 'Officier' },
    { mat: 'MSA/2015/118', nom: 'RABEMANANTSOA', prenoms: 'Minoarisoa', age: 39, sx: 'F', grade: 'Capitaine de Corvette', unite: uniteBana, spe: 'Commissariat de la flotte', sitFamiliale: 'Célibataire', email: 'm.rabemanantsoa@marines.mg', tel: '+261 34 000 000 02', corps: 'Officier' },
    { mat: 'MSA/2008/021', nom: 'ANDRIANARISON', prenoms: 'Tiana Hery', age: 48, sx: 'M', grade: 'Capitaine de Frégate', unite: uniteEmmn, spe: 'Commandement', sitFamiliale: 'Marié(e)', email: 't.andrianarison@marines.mg', tel: '+261 34 000 000 03', corps: 'Officier' },
    { mat: 'MSA/2020/203', nom: 'RASOANAIVO', prenoms: 'Faneva', age: 30, sx: 'F', grade: 'Enseigne de Vaisseau de 1re classe', unite: uniteBana, spe: 'Transmissions', sitFamiliale: 'Célibataire', email: 'f.rasoanaivo@marines.mg', tel: '+261 34 000 000 04', corps: 'Officier' },
    { mat: 'MSA/1999/007', nom: 'RAKOTOVAO', prenoms: 'Blaise Norbert', age: 55, sx: 'M', grade: 'Capitaine de Vaisseau', unite: uniteEmmn, spe: 'Commandement', sitFamiliale: 'Marié(e)', email: 'b.rakotovao@marines.mg', tel: '+261 34 000 000 05', corps: 'Officier' },
    { mat: 'MSA/2003/056', nom: 'RAMAROSON', prenoms: 'Henintsoa', age: 50, sx: 'F', grade: 'Maître Principal', unite: uniteBana, spe: 'Machinerie navale', sitFamiliale: 'Marié(e)', email: 'h.ramaroson@marines.mg', tel: '+261 34 000 000 06', corps: 'Sous-officier' },
    { mat: 'MSA/2011/087', nom: 'RANDRIANJAFY', prenoms: 'Maminiaina', age: 41, sx: 'M', grade: 'Premier Maître', unite: uniteEmmn, spe: 'Électronique embarquée', sitFamiliale: 'Marié(e)', email: 'm.randrianjafy@marines.mg', tel: '+261 34 000 000 07', corps: 'Sous-officier' },
    { mat: 'MSA/2016/144', nom: 'ANDRIANTSOA', prenoms: 'Voahirana', age: 36, sx: 'F', grade: 'Maître', unite: uniteBana, spe: 'Soutien santé (infirmier)', sitFamiliale: 'Marié(e)', email: 'v.andriantsoa@marines.mg', tel: '+261 34 000 000 08', corps: 'Sous-officier' },
    { mat: 'MSA/2021/221', nom: 'RAKOTOARIMANANA', prenoms: 'Soa Miora', age: 28, sx: 'F', grade: 'Second Maître de 2e classe', unite: uniteEmmn, spe: 'Transmissions', sitFamiliale: 'Célibataire', email: 's.rakotoarimanana@marines.mg', tel: '+261 34 000 000 09', corps: 'Sous-officier' },
    { mat: 'MSA/2018/169', nom: 'RABEARIVELO', prenoms: 'Fidy José', age: 33, sx: 'M', grade: 'Second Maître de 1re classe', unite: uniteBana, spe: 'Armement', sitFamiliale: 'Marié(e)', email: 'f.rabearivelo@marines.mg', tel: '+261 34 000 000 10', corps: 'Sous-officier' },
    { mat: 'MSA/2023/255', nom: 'RANDRIAMANDRY', prenoms: 'Hery Nomena', age: 24, sx: 'M', grade: 'Quartier-Maître de 2e classe', unite: uniteEmmn, spe: 'Navigation maritime', sitFamiliale: 'Célibataire', email: 'h.randriamandry@marines.mg', tel: '+261 34 000 000 11', corps: 'Militaire du rang' },
    { mat: 'MSA/2022/238', nom: 'RAHERINIRINA', prenoms: 'Lalaina', age: 26, sx: 'F', grade: 'Quartier-Maître de 1re classe', unite: uniteBana, spe: 'Écoute et renseignement', sitFamiliale: 'Célibataire', email: 'l.raherinirina@marines.mg', tel: '+261 34 000 000 12', corps: 'Militaire du rang' },
    { mat: 'MSA/2024/267', nom: 'RATSIMBAZAFY', prenoms: 'Tojo', age: 23, sx: 'M', grade: 'Matelot de 1re classe', unite: uniteEmmn, spe: 'Plongée', sitFamiliale: 'Célibataire', email: 't.ratsimbazafy@marines.mg', tel: '+261 34 000 000 13', corps: 'Militaire du rang' },
    // Cas d'alerte fin de lien (CDC §2.3)
    { mat: 'MSA/1985/003', nom: 'RAZANADRASOA', prenoms: 'Georges', age: 58, sx: 'M', grade: 'Quartier-Maître de 2e classe', unite: uniteBana, spe: 'Machinerie navale', sitFamiliale: 'Marié(e)', email: 'g.razanadrasoa@marines.mg', corps: 'Militaire du rang' },
    { mat: 'MSA/1983/011', nom: 'RANDRIA', prenoms: 'Olivier', age: 45, sx: 'M', grade: 'Quartier-Maître de 2e classe', unite: uniteEmmn, spe: 'Artillerie navale', sitFamiliale: 'Marié(e)', email: 'o.randria@marines.mg', corps: 'Militaire du rang' },
    { mat: 'MSA/1982/015', nom: 'RAZAFINDRANJATO', prenoms: 'Clément', age: 44, sx: 'M', grade: 'Quartier-Maître de 1re classe', unite: uniteBana, spe: 'Écoute et renseignement', sitFamiliale: 'Célibataire', email: 'c.razafindranjato@marines.mg', corps: 'Militaire du rang' },
    { mat: 'MSA/1962/001', nom: 'RAMANANDRAIBE', prenoms: 'Aristide', age: 64, sx: 'M', grade: 'Quartier-Maître de 1re classe', unite: uniteEmmn, spe: 'Service général', sitFamiliale: 'Marié(e)', email: 'a.ramanandraibe@marines.mg', corps: 'Militaire du rang' },
  ];

  console.log(`Création de ${personnelList.length} fiches personnel…`);
  const comptes: Array<{ personnelId: string; identifiant: string; role: 'ADMIN_SYSTEME' | 'RH_ETAT_MAJOR' | 'RH_BASE' | 'CHEF_COMMANDEMENT' | 'PERSONNEL'; uniteId?: string | null; motDePasse?: string }> = [];

  for (const [i, p] of personnelList.entries()) {
    const dateNaissance = new Date(`${new Date().getFullYear() - p.age}-01-15`);
    const grade = grades.get(p.grade)!;
    const personnel = await prisma.personnel.create({
      data: {
        matriculeRecrutement: p.mat,
        nom: p.nom,
        prenoms: p.prenoms,
        sexe: p.sx,
        dateNaissance,
        lieuNaissance: p.unite.baseId === baseBana.id ? 'Antsiranana' : 'Antananarivo',
        email: p.email ?? null,
        telephoneMobile: p.tel ?? null,
        statutFamilial: p.sitFamiliale ?? null,
        corps: p.corps ?? null,
        gradeId: grade.id,
        uniteId: p.unite.id,
        specialiteId: specialites.get(p.spe)?.id ?? null,
        situationMilitaire: 'EN_ACTIVITE',
        dateEntreeService: new Date(`${2004 - (i % 20)}-03-01`),
        niveauInstruction: 'BACC',
        numeroCIN: `${1010 + i}${String(30303030 + i)}`,
      },
    });

    const role: typeof comptes[0]['role'] = i === 0 ? 'ADMIN_SYSTEME' : i === 1 ? 'RH_ETAT_MAJOR' : i === 2 ? 'CHEF_COMMANDEMENT' : 'PERSONNEL';
    comptes.push({
      personnelId: personnel.id,
      identifiant: i === 0 ? 'admin' : i === 1 ? 'rh.emm' : i === 2 ? 'chef.emm' : p.mat,
      role,
      uniteId: role === 'RH_BASE' ? uniteBana.id : null,
    });
  }

  // Un compte RH_BASE supplémentaire (périmètre BANA).
  const rhBasePersonnel = await prisma.personnel.create({
    data: {
      matriculeRecrutement: 'MSA/2014/099',
      nom: 'RAMANANARIVO',
      prenoms: 'Aina',
      sexe: 'F',
      dateNaissance: new Date('1988-07-21'),
      lieuNaissance: 'Antsiranana',
      email: 'a.ramananarivo@marines.mg',
      gradeId: grades.get('Premier Maître')!.id,
      uniteId: uniteBana.id,
      situationMilitaire: 'EN_ACTIVITE',
    },
  });
  comptes.push({
    personnelId: rhBasePersonnel.id,
    identifiant: 'rh.bana',
    role: 'RH_BASE',
    uniteId: uniteBana.id,
  });

  // Effectifs du 2ème BIMA (CDC §2.1) pour illustrer la structure complète.
  const uniteBima1 = await prisma.unite.findFirst({ where: { code: 'CIMA1', baseId: baseBima.id } });
  const uniteBimaCcs = await prisma.unite.findFirst({ where: { code: 'CCS', baseId: baseBima.id } });
  const personnelsBima = [
    { mat: 'MSA/2012/090', nom: 'RANDRIANASOLO', prenoms: 'Hery Manana', sx: 'M', age: 38, grade: 'Maître', spe: 'Navigation maritime', sitFamiliale: 'Marié(e)', unite: uniteBima1! },
    { mat: 'MSA/2017/150', nom: 'RAZAFIMAHATRATRA', prenoms: 'Mialy', sx: 'F', age: 32, grade: 'Second Maître de 1re classe', spe: 'Transmissions', sitFamiliale: 'Célibataire', unite: uniteBimaCcs! },
  ];
  for (const p of personnelsBima) {
    const dateNaissance = new Date(`${new Date().getFullYear() - p.age}-05-20`);
    const personnel = await prisma.personnel.create({
      data: {
        matriculeRecrutement: p.mat,
        nom: p.nom,
        prenoms: p.prenoms,
        sexe: p.sx,
        dateNaissance,
        lieuNaissance: 'Antsiranana',
        statutFamilial: p.sitFamiliale ?? null,
        corps: p.grade.startsWith('Maître') || p.grade.startsWith('Second') ? 'Sous-officier' : 'Officier',
        gradeId: grades.get(p.grade)!.id,
        uniteId: p.unite.id,
        specialiteId: specialites.get(p.spe)?.id ?? null,
        situationMilitaire: 'EN_ACTIVITE',
        dateEntreeService: new Date(`${2006 + p.age % 10}-03-01`),
        niveauInstruction: 'BEPC',
        numeroCIN: `${3030 + p.age}${String(40404040 + p.age)}`,
      },
    });
    comptes.push({
      personnelId: personnel.id,
      identifiant: p.mat,
      role: 'PERSONNEL',
    });
  }

  console.log('Création des comptes de démonstration…');
  const motDePasse = 'EmMn@2026!Demo';
  for (const c of comptes) {
    await prisma.compteUtilisateur.create({
      data: {
        personnelId: c.personnelId,
        identifiant: c.identifiant,
        motDePasseHash: await hash(c.motDePasse ?? motDePasse, 10),
        typeCompte: c.role,
        uniteId: c.role === 'RH_BASE' ? c.uniteId ?? null : c.role === 'CHEF_COMMANDEMENT' ? c.uniteId ?? null : null,
        actif: true,
        doitChangerMotDePasse: false,
      },
    });
  }

  console.log('Seed terminé. Comptes de démonstration (mot de passe commun : EmMn@2026!Demo) :');
  for (const c of comptes.slice(0, 4)) {
    console.log(`  - ${c.identifiant} (${c.role})`);
  }
  console.log(`  - rh.bana (RH_BASE)${''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());