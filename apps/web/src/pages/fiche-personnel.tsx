import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Plus, Upload, Pencil } from 'lucide-react';
import { api, multipart, rawHttp } from '@/lib/api';
import { Badge, Bouton, Carte, Champ, ChargementLigne, Choix, Entree, EtatVide, Fenetre } from '@/components/ui';
import { format } from 'date-fns';

interface OngletEntree { id: string; createdAt?: string; [cle: string]: unknown }

interface DefOnglet {
  cle: string;
  clesApi: string;
  clesDonnees: string;
  libelle: string;
  colonnes: Array<{ k: string; libelle: string }>;
  formulaire: Array<{ k: string; libelle: string; type?: 'date' | 'select'; options?: Array<{ v: string; l: string }>; requis?: boolean }>;
}

const ONGLETS: DefOnglet[] = [
  {
    cle: 'enfants', clesApi: 'enfants', clesDonnees: 'enfants', libelle: 'Enfants',
    colonnes: [{ k: 'rang', libelle: 'Rang' }, { k: 'nom', libelle: 'Nom' }, { k: 'prenoms', libelle: 'Prénoms' }, { k: 'dateNaissance', libelle: 'Naissance' }],
    formulaire: [
      { k: 'rang', libelle: 'Rang', requis: true },
      { k: 'nom', libelle: 'Nom', requis: true },
      { k: 'prenoms', libelle: 'Prénoms' },
      { k: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      { k: 'sexe', libelle: 'Sexe', type: 'select', options: [{ v: 'M', l: 'Masculin' }, { v: 'F', l: 'Féminin' }] },
      { k: 'lienParente', libelle: 'Lien de parenté' },
    ],
  },
  {
    cle: 'historique-grades', clesApi: 'historique-grades', clesDonnees: 'historiqueGrades', libelle: 'Historique des grades',
    colonnes: [{ k: 'grade', libelle: 'Grade' }, { k: 'referenceDecret', libelle: 'Réf. décret' }, { k: 'datePriseCommandement', libelle: 'Prise commandement' }],
    formulaire: [
      { k: 'gradeId', libelle: 'Grade', type: 'select', requis: true },
      { k: 'referenceDecret', libelle: 'Référence décret' },
      { k: 'datePriseCommandement', libelle: 'Date de prise de commandement', type: 'date' },
      { k: 'observations', libelle: 'Observations' },
    ],
  },
  {
    cle: 'cursus', clesApi: 'cursus', clesDonnees: 'cursusScolaire', libelle: 'Cursus scolaire / formation',
    colonnes: [{ k: 'diplome', libelle: 'Diplôme' }, { k: 'etablissement', libelle: 'Établissement' }, { k: 'dateDebut', libelle: 'Début' }, { k: 'dateFin', libelle: 'Fin' }],
    formulaire: [
      { k: 'diplome', libelle: 'Diplôme / formation', requis: true },
      { k: 'etablissement', libelle: 'Établissement' },
      { k: 'dateDebut', libelle: 'Début', type: 'date' },
      { k: 'dateFin', libelle: 'Fin', type: 'date' },
      { k: 'mention', libelle: 'Mention' },
    ],
  },
  {
    cle: 'stages', clesApi: 'stages', clesDonnees: 'stagesMilitaires', libelle: 'Stages militaires',
    colonnes: [{ k: 'intitule', libelle: 'Intitulé' }, { k: 'dateDebut', libelle: 'Début' }, { k: 'dateFin', libelle: 'Fin' }],
    formulaire: [
      { k: 'intitule', libelle: 'Intitulé du stage', requis: true },
      { k: 'dateDebut', libelle: 'Début', type: 'date' },
      { k: 'dateFin', libelle: 'Fin', type: 'date' },
      { k: 'lieu', libelle: 'Lieu' },
    ],
  },
  {
    cle: 'langues', clesApi: 'langues', clesDonnees: 'competencesLinguistiques', libelle: 'Langues parlées',
    colonnes: [{ k: 'langue', libelle: 'Langue' }, { k: 'niveau', libelle: 'Niveau' }],
    formulaire: [
      { k: 'langue', libelle: 'Langue', requis: true },
      { k: 'niveau', libelle: 'Niveau' },
    ],
  },
  {
    cle: 'affectations', clesApi: 'affectations', clesDonnees: 'affectations', libelle: 'Affectations',
    colonnes: [{ k: 'unite', libelle: 'Unité' }, { k: 'dateEffet', libelle: 'Date d’effet' }],
    formulaire: [
      { k: 'uniteId', libelle: 'Unité', type: 'select', requis: true },
      { k: 'dateEffet', libelle: 'Date d’effet', type: 'date' },
      { k: 'referenceDecret', libelle: 'Référence décret' },
    ],
  },
  {
    cle: 'decorations', clesApi: 'decorations', clesDonnees: 'decorations', libelle: 'Décorations',
    colonnes: [{ k: 'intitule', libelle: 'Intitulé' }, { k: 'dateEffet', libelle: 'Date d’effet' }],
    formulaire: [
      { k: 'intitule', libelle: 'Intitulée', requis: true },
      { k: 'dateEffet', libelle: 'Date d’effet', type: 'date' },
      { k: 'referenceDecret', libelle: 'Référence' },
    ],
  },
];

const CHAMPS_EDITABLES: Array<{ k: string; libelle: string; type?: 'date' | 'select' }> = [
  { k: 'matriculeRecrutement', libelle: 'Matricule de recrutement' },
  { k: 'matriculeFinancier', libelle: 'Matricule financier' },
  { k: 'nom', libelle: 'Nom' },
  { k: 'prenoms', libelle: 'Prénoms' },
  { k: 'email', libelle: 'Email' },
  { k: 'telephoneMobile', libelle: 'Téléphone mobile' },
  { k: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
  { k: 'lieuNaissance', libelle: 'Lieu de naissance' },
  { k: 'prefecture', libelle: 'Préfecture' },
  { k: 'sousPrefecture', libelle: 'Sous-préfecture' },
  { k: 'province', libelle: 'Province' },
  { k: 'numeroCIN', libelle: 'N° CIN' },
  { k: 'dateDelivranceCIN', libelle: 'Date délivrance CIN', type: 'date' },
  { k: 'lieuDelivranceCIN', libelle: 'Lieu de délivrance CIN' },
  { k: 'dateDuplicataCIN', libelle: 'Date duplicata CIN', type: 'date' },
  { k: 'numeroPasseport', libelle: 'N° passeport' },
  { k: 'dateDelivrancePasseport', libelle: 'Date délivrance passeport', type: 'date' },
  { k: 'religion', libelle: 'Religion' },
  { k: 'groupeSanguin', libelle: 'Groupe sanguin' },
  { k: 'taille', libelle: 'Taille (m)' },
  { k: 'adresseActuelle', libelle: 'Adresse actuelle' },
  { k: 'adresseRepli', libelle: 'Adresse de repli' },
  { k: 'contactUrgence', libelle: 'Contact d’urgence' },
  { k: 'statutFamilial', libelle: 'Situation familiale', type: 'select' },
  { k: 'numeroAutorisationMariage', libelle: 'N° autorisation de mariage' },
  { k: 'dateAutorisationMariage', libelle: 'Date autorisation de mariage', type: 'date' },
  { k: 'nomConjoint', libelle: 'Nom du conjoint' },
  { k: 'dateNaissanceConjoint', libelle: 'Naissance du conjoint', type: 'date' },
  { k: 'lieuNaissanceConjoint', libelle: 'Lieu de naissance du conjoint' },
  { k: 'fonctionConjoint', libelle: 'Fonction du conjoint' },
  { k: 'sportsPratiques', libelle: 'Sports pratiqués' },
  { k: 'nomPere', libelle: 'Père' },
  { k: 'nomMere', libelle: 'Mère' },
  { k: 'corps', libelle: 'Corps' },
  { k: 'lieuEmploi', libelle: 'Lieu d’emploi' },
  { k: 'fonctionActuelle', libelle: 'Fonction actuelle' },
  { k: 'numeroCIM', libelle: 'N° CIM' },
  { k: 'dateDelivranceCIM', libelle: 'Date délivrance CIM', type: 'date' },
  { k: 'dateEffetSOC_HDRC', libelle: 'Date effet SOC / HDRC', type: 'date' },
  { k: 'referenceSOC_HDRC', libelle: 'Référence SOC / HDRC' },
  { k: 'dateEffetPrimeTechnicite', libelle: 'Date effet prime de technicité', type: 'date' },
  { k: 'referencePrimeTechnicite', libelle: 'Référence prime de technicité' },
  { k: 'numeroPermisCivil', libelle: 'N° permis civil' },
  { k: 'datePermisCivil', libelle: 'Date permis civil', type: 'date' },
  { k: 'numeroPermisMilitaire', libelle: 'N° permis militaire' },
  { k: 'datePermisMilitaire', libelle: 'Date permis militaire', type: 'date' },
  { k: 'situationMilitaire', libelle: 'Situation militaire' },
  { k: 'origineRecrutement', libelle: 'Origine du recrutement' },
  { k: 'dateEntreeService', libelle: 'Date d’entrée en service', type: 'date' },
  { k: 'interruptionsService', libelle: 'Interruptions de service' },
  { k: 'dateLiberationServiceNational', libelle: 'Libération service national', type: 'date' },
  { k: 'datePremierRengagement', libelle: 'Premier réengagement', type: 'date' },
  { k: 'niveauInstruction', libelle: 'Niveau d’instruction' },
  { k: 'connaissancesInformatiques', libelle: 'Connaissances informatiques (CDC §2.2e)' },
];

const SITUATIONS_FAMILIALES = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(Ve)'];

export function FichePersonnel() {
  const { id = '' } = useParams();
  const [onglet, setOnglet] = useState('identite');
  const [docOuvert, setDocOuvert] = useState(false);

  const detail = useQuery({ queryKey: ['personnel', id], queryFn: () => api.personnel.detail(id) });
  const grades = useQuery({ queryKey: ['grades'], queryFn: () => api.referentiels.grades() });
  const unites = useQuery({ queryKey: ['unites'], queryFn: () => api.referentiels.unites() });

  const p = detail.data;

  return (
    <div className="space-y-5">
      <Link to="/effectifs" className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline">
        <ArrowLeft size={14} /> Effectifs
      </Link>

      {detail.isLoading && <ChargementLigne />}
      {detail.isError && <EtatVide message="Fiche introuvable ou accès refusé." />}
      {p && (
        <>
          <div className="carte px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {p.photo && <img src={p.photo} alt="Photo" className="h-16 w-16 rounded-full bg-slate-100 object-cover" />}
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{p.nom} {p.prenoms}</h1>
                  <p className="text-sm text-slate-500">
                    Matricule : <span className="font-mono">{p.matriculeRecrutement}</span>
                    {' — '}{p.grade?.libelle ?? '—'} — {p.unite?.nom ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.finDeLien?.statut !== 'NEANT' && (
                  <Badge couleur={p.finDeLien.statut === 'DANS_2_ANS' ? 'rouge' : p.finDeLien.statut === 'DANS_1_AN' ? 'ambre' : 'gris'}>
                    {p.finDeLien.statut === 'RETRAITE' ? 'Limite atteinte' : p.finDeLien.statut === 'DANS_1_AN' ? 'Limite ≤ 1 an' : 'Limite ≤ 2 ans'}
                    {p.finDeLien.dateFinDeLien ? ` — ${format(new Date(p.finDeLien.dateFinDeLien), 'dd/MM/yyyy')}` : ''}
                  </Badge>
                )}
                <Bouton variante="secondaire" onClick={() => void api.rapports.fichePersonnelPdf(p.id)}>
                  <Download size={15} /> Imprimer la fiche
                </Bouton>
                <Bouton variante="secondaire" onClick={() => setDocOuvert(true)}>
                  <Upload size={15} /> Documents
                </Bouton>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            <OngletBouton actif={onglet === 'identite'} onClick={() => setOnglet('identite')}>Identification</OngletBouton>
            {ONGLETS.map((o) => (
              <OngletBouton key={o.cle} actif={onglet === o.cle} onClick={() => setOnglet(o.cle)}>{o.libelle}</OngletBouton>
            ))}
            <OngletBouton actif={onglet === 'documents'} onClick={() => setOnglet('documents')}>Pièces jointes</OngletBouton>
          </div>

          {onglet === 'identite' && <Identite p={p} />}
          {onglet === 'documents' && <Documents pid={id} />}
          {onglet !== 'identite' && onglet !== 'documents' && (
            <OngletDonnees p={p} def={ONGLETS.find((o) => o.cle === onglet)!} grades={grades.data ?? []} unites={unites.data ?? []} />
          )}

          <DialogueDocuments ouvert={docOuvert} onFermer={() => setDocOuvert(false)} pid={id} />
        </>
      )}
    </div>
  );
}

function OngletBouton({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        actif ? 'border-marine-700 text-marine-800' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function LigneValeur({ cle, valeur }: { cle: string; valeur?: unknown }) {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{cle}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valeur as string}</dd>
    </div>
  );
}

function Identite({ p }: { p: any }) {
  const fmtd = (v: unknown) => (v ? format(new Date(v as string), 'dd/MM/yyyy') : '');

  const sections: Array<{ titre: string; champs: Array<[string, unknown]> }> = [
    {
      titre: 'Identification',
      champs: [
        ['Matricule', p.matriculeRecrutement], ['Matricule financier', p.matriculeFinancier],
        ['Nom', p.nom], ['Prénoms', p.prenoms], ['Sexe', p.sexe],
        ['Date de naissance', p.dateNaissance ? fmtd(p.dateNaissance) : ''], ['Lieu de naissance', p.lieuNaissance],
        ['Préfecture', p.prefecture], ['Sous-préfecture', p.sousPrefecture], ['Province', p.province],
        ['Taille', p.taille ? `${p.taille} m` : ''], ['Groupe sanguin', p.groupeSanguin], ['Religion', p.religion],
      ],
    },
    {
      titre: 'Pièces d’identité',
      champs: [
        ['N° CIN', p.numeroCIN], ['Délivrance CIN', p.dateDelivranceCIN ? fmtd(p.dateDelivranceCIN) : ''],
        ['Lieu CIN', p.lieuDelivranceCIN], ['Duplicata CIN', p.dateDuplicataCIN ? fmtd(p.dateDuplicataCIN) : ''],
        ['N° passeport', p.numeroPasseport], ['Délivrance passeport', p.dateDelivrancePasseport ? fmtd(p.dateDelivrancePasseport) : ''],
      ],
    },
    {
      titre: 'Coordonnées et domicile',
      champs: [
        ['Email', p.email], ['Téléphone', p.telephoneMobile], ['Adresse actuelle', p.adresseActuelle],
        ['Adresse de repli', p.adresseRepli], ['Contact d’urgence', p.contactUrgence],
      ],
    },
    {
      titre: 'Situation familiale',
      champs: [
        ['Situation familiale', p.statutFamilial], ['N° autorisation mariage', p.numeroAutorisationMariage],
        ['Date autorisation mariage', p.dateAutorisationMariage ? fmtd(p.dateAutorisationMariage) : ''],
        ['Conjoint', p.nomConjoint], ['Naissance conjoint', p.dateNaissanceConjoint ? fmtd(p.dateNaissanceConjoint) : ''],
        ['Lieu naissance conjoint', p.lieuNaissanceConjoint], ['Fonction conjoint', p.fonctionConjoint],
        ['Père', p.nomPere], ['Mère', p.nomMere], ['Sports pratiqués', p.sportsPratiques],
      ],
    },
    {
      titre: 'Carrière et affectation',
      champs: [
        ['Grade', p.grade?.libelle], ['Corps', p.corps], ['Spécialité', p.specialite?.libelle],
        ['Unité', p.unite?.nom], ['Base', p.unite?.base?.nom], ['Fonction actuelle', p.fonctionActuelle],
        ['Lieu d’emploi', p.lieuEmploi], ['Situation militaire', p.situationMilitaire],
        ['Origine du recrutement', p.origineRecrutement],
        ['Entrée en service', p.dateEntreeService ? fmtd(p.dateEntreeService) : ''],
        ['Interruptions de service', p.interruptionsService],
        ['Libération service national', p.dateLiberationServiceNational ? fmtd(p.dateLiberationServiceNational) : ''],
        ['Premier réengagement', p.datePremierRengagement ? fmtd(p.datePremierRengagement) : ''],
        ['Niveau d’instruction', p.niveauInstruction],
        ['Connaissances informatiques', p.connaissancesInformatiques],
      ],
    },
    {
      titre: 'Situation militaire — décisions',
      champs: [
        ['N° CIM', p.numeroCIM], ['Délivrance CIM', p.dateDelivranceCIM ? fmtd(p.dateDelivranceCIM) : ''],
        ['Effet SOC / HDRC', p.dateEffetSOC_HDRC ? fmtd(p.dateEffetSOC_HDRC) : ''], ['Réf. SOC / HDRC', p.referenceSOC_HDRC],
        ['Effet prime technicité', p.dateEffetPrimeTechnicite ? fmtd(p.dateEffetPrimeTechnicite) : ''],
        ['Réf. prime technicité', p.referencePrimeTechnicite],
        ['Permis civil', p.numeroPermisCivil], ['Date permis civil', p.datePermisCivil ? fmtd(p.datePermisCivil) : ''],
        ['Permis militaire', p.numeroPermisMilitaire], ['Date permis militaire', p.datePermisMilitaire ? fmtd(p.datePermisMilitaire) : ''],
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <ModifierFiche p={p} />
      {p.photo && (
        <Carte titre="Photo">
          <img src={p.photo} alt="Photo du personnel" className="max-h-48 rounded-lg border border-slate-200" />
        </Carte>
      )}
      {sections.map((sec) => (
        <Carte key={sec.titre} titre={sec.titre}>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {sec.champs.map(([cle, valeur]) => (
              <LigneValeur key={cle} cle={cle} valeur={valeur} />
            ))}
          </dl>
        </Carte>
      ))}
    </div>
  );
}

function ModifierFiche({ p }: { p: any }) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);

  const ouvrir = () => {
    const init: Record<string, string> = {};
    for (const f of CHAMPS_EDITABLES) {
      const v = p[f.k];
      init[f.k] = v ? (f.type === 'date' ? String(v).slice(0, 10) : String(v)) : '';
    }
    setValeurs(init);
    setMsg(null);
    setOuvert(true);
  };

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => {
      const propre: Record<string, string> = {};
      for (const [k, v] of Object.entries(body)) {
        if (v !== '' && v !== null && v !== undefined) propre[k] = v;
      }
      return api.personnel.modifier(p.id, propre);
    },
    onSuccess: () => {
      setMsg({ ok: true, texte: 'Fiche mise à jour.' });
      void queryClient.invalidateQueries({ queryKey: ['personnel', p.id] });
    },
    onError: (e: Error) => setMsg({ ok: false, texte: e.message }),
  });

  return (
    <>
      <Bouton variante="secondaire" onClick={ouvrir}>
        <Pencil size={15} /> Modifier la fiche
      </Bouton>
      <Fenetre ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Modifier l’identification" largeur="max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHAMPS_EDITABLES.map((f) => (
            <Champ key={f.k} label={f.libelle}>
              {f.type === 'select' ? (
                <Choix value={valeurs[f.k] ?? ''} onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}>
                  <option value="">—</option>
                  {SITUATIONS_FAMILIALES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Choix>
              ) : (
                <Entree
                  type={f.type === 'date' ? 'date' : 'text'}
                  value={valeurs[f.k] ?? ''}
                  onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}
                />
              )}
            </Champ>
          ))}
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.texte}</p>}
        <div className="mt-4 flex gap-2">
          <Bouton onClick={() => mutation.mutate(valeurs)} disabled={mutation.isPending}>Enregistrer</Bouton>
          <Bouton variante="ghost" onClick={() => setOuvert(false)}>Fermer</Bouton>
        </div>
      </Fenetre>
    </>
  );
}

function OngletDonnees({ p, def, grades, unites }: { p: any; def: DefOnglet; grades: Array<{ id: string; libelle: string }>; unites: Array<{ id: string; nom: string }> }) {
  const queryClient = useQueryClient();
  const [ajout, setAjout] = useState(false);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const items: OngletEntree[] = p[def.clesDonnees] ?? [];
  const rafraichir = (pid: string) => void queryClient.invalidateQueries({ queryKey: ['personnel', pid] });

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => api.onglets.creer(p.id, def.clesApi, body),
    onSuccess: () => {
      setAjout(false);
      setValeurs({});
      rafraichir(p.id);
    },
    onError: (e: Error) => setErr(e.message),
  });

  async function supprimer(itemId: string) {
    if (!window.confirm(`Supprimer cet élément de « ${def.libelle} » ?`)) return;
    try {
      await api.onglets.supprimer(p.id, def.clesApi, itemId);
      rafraichir(p.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  const options = (cle: string) =>
    cle === 'gradeId' ? grades.map((g) => ({ v: g.id, l: g.libelle }))
    : cle === 'uniteId' ? unites.map((u) => ({ v: u.id, l: u.nom }))
    : [];

  return (
    <Carte
      titre={def.libelle}
      action={
        <Bouton variante="secondaire" onClick={() => setAjout((v) => !v)}>
          <Plus size={15} /> Ajouter
        </Bouton>
      }
    >
      {items.length === 0 && <EtatVide message="Aucune donnée dans cet onglet." />}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-entete border-b border-slate-200 bg-slate-50">
              <tr>
                {def.colonnes.map((c) => <th key={c.k} className="hidden md:table-cell">{c.libelle}</th>)}
                <th className="md:hidden">{def.colonnes[0]?.libelle}</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="table-ligne">
                  {def.colonnes.map((c) => (
                    <td key={c.k} className="cellule-table hidden text-xs text-slate-700 md:table-cell">
                      {c.k === 'grade' ? (item as any).grade?.libelle ?? item[c.k] ?? '—'
                        : c.k === 'unite' ? (item as any).unite?.nom ?? item[c.k] ?? '—'
                        : typeof item[c.k] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(String(item[c.k]))
                          ? format(new Date(String(item[c.k])), 'dd/MM/yyyy')
                          : item[c.k] ?? '—'}
                    </td>
                  ))}
                  <td className="cellule-table text-xs md:hidden">{String(item[def.colonnes[0].k] ?? '')}</td>
                  <td className="cellule-table text-right">
                    <button className="text-xs text-red-600 hover:underline" onClick={() => void supprimer(item.id)}>Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ajout && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {def.formulaire.map((f) => {
              const opt = options(f.k).length > 0 ? options(f.k) : f.options ?? [];
              return (
                <Champ key={f.k} label={f.libelle}>
                  {f.type === 'select' ? (
                    <Choix value={valeurs[f.k] ?? ''} onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}>
                      <option value="">—</option>
                      {opt.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </Choix>
                  ) : (
                    <Entree
                      type={f.type === 'date' ? 'date' : 'text'}
                      value={valeurs[f.k] ?? ''}
                      onChange={(e) => setValeurs({ ...valeurs, [f.k]: e.target.value })}
                    />
                  )}
                </Champ>
              );
            })}
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <div className="mt-3 flex gap-2">
            <Bouton onClick={() => mutation.mutate(valeurs)} disabled={mutation.isPending}>
              Enregistrer
            </Bouton>
            <Bouton variante="ghost" onClick={() => setAjout(false)}>Annuler</Bouton>
          </div>
        </div>
      )}
    </Carte>
  );
}

function Documents({ pid }: { pid: string }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Array<{ ok: boolean; texte: string }>>([]);

  const liste = useQuery({
    queryKey: ['pj', pid],
    queryFn: () => rawHttp(`/personnel/${pid}/pieces-jointes`) as Promise<unknown[]>,
  });

  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fichier = fd.get('fichier') as File | null;
    const type = fd.get('type') as string | null;
    if (!fichier || fichier.size === 0) return;
    try {
      await multipart(`/personnel/${pid}/pieces-jointes`, fichier, type);
      setMessages((m) => [...m, { ok: true, texte: `Fichier ${fichier.name} ajouté.` }]);
      void queryClient.invalidateQueries({ queryKey: ['pj', pid] });
    } catch (error) {
      setMessages((m) => [...m, { ok: false, texte: error instanceof Error ? error.message : String(error) }]);
    }
  };

  return (
    <Carte titre="Pièces jointes — prévisualisation et historique des versions (CDC §2.2j)">
      <form onSubmit={envoyer} className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <Champ label="Type de pièce">
          <Choix name="type" required>
            <option value="AUTRE">Autre</option>
            <option value="DECISION">Décision</option>
            <option value="ARRETE">Arrêté</option>
            <option value="CONTRAT">Contrat</option>
            <option value="DIPLOME">Diplôme</option>
            <option value="RAPPORT">Rapport</option>
          </Choix>
        </Champ>
        <Champ label="Fichier (PDF, image, Word ≤ 10 Mo)">
          <Entree type="file" name="fichier" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" required />
        </Champ>
        <Bouton type="submit"><Upload size={15} /> Déposer</Bouton>
      </form>

      {messages.map((m, i) => (
        <p key={i} className={`mb-1 text-sm ${m.ok ? 'text-emerald-700' : 'text-red-600'}`}>{m.texte}</p>
      ))}

      {liste.isLoading && <ChargementLigne />}
      {(liste.data?.length ?? 0) === 0 && !liste.isLoading && <EtatVide message="Aucune pièce jointe." />}
      {liste.data && liste.data.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {liste.data.map((pj: any) => {
            const versions = pj.versions ?? [];
            const active = versions[0];
            const estImage = active?.mimeType?.startsWith('image/');
            return (
              <li key={pj.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{active?.nomOriginal ?? pj.nomOriginale ?? 'Pièce jointe'}</p>
                    <p className="text-xs text-slate-500">Type {pj.type} — {versions.length} version(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline"
                      href={`/api/pieces-jointes/${pj.id}/preview`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye size={14} /> Prévisualiser
                    </a>
                    <a
                      className="inline-flex items-center gap-1 text-sm text-marine-700 hover:underline"
                      href={`/api/pieces-jointes/${pj.id}/telecharger`}
                      download
                    >
                      <Download size={14} /> Télécharger
                    </a>
                  </div>
                </div>
                {estImage && active && (
                  <img
                    src={`/api/pieces-jointes/${pj.id}/preview`}
                    alt="Aperçu"
                    className="mt-2 max-h-40 rounded border border-slate-200 object-contain"
                  />
                )}
                {versions.length > 1 && (
                  <ul className="mt-2 space-y-1 border-l-2 border-slate-200 pl-3">
                    {versions.map((v: any, i: number) => (
                      <li key={v.id} className="flex items-center justify-between text-xs text-slate-500">
                        <span>Version {versions.length - i} — {v.nomOriginal} — {v.dateDepot ? format(new Date(v.dateDepot), 'dd/MM/yyyy') : ''} — {(v.tailleOctets / 1024).toFixed(1)} Ko</span>
                        <span className="flex gap-2">
                          <a className="text-marine-700 hover:underline" href={`/api/pieces-jointes/versions/${v.id}/preview`} target="_blank" rel="noreferrer">voir</a>
                          <a className="text-marine-700 hover:underline" href={`/api/pieces-jointes/versions/${v.id}/telecharger`} download>télécharger</a>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
}

function DialogueDocuments({ ouvert, onFermer, pid }: { ouvert: boolean; onFermer: () => void; pid: string }) {
  const queryClient = useQueryClient();
  const envoyer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fichier = fd.get('fichier') as File | null;
    const type = fd.get('type') as string | null;
    if (!fichier || fichier.size === 0) return;
    await multipart(`/personnel/${pid}/pieces-jointes`, fichier, type);
    void queryClient.invalidateQueries({ queryKey: ['pj', pid] });
    onFermer();
  };
  return (
    <Fenetre ouvert={ouvert} onFermer={onFermer} titre="Ajouter une pièce jointe">
      <form onSubmit={envoyer} className="space-y-3">
        <Champ label="Type">
          <Choix name="type"><option value="AUTRE">Autre</option><option value="DECISION">Décision</option><option value="ARRETE">Arrêté</option><option value="CONTRAT">Contrat</option><option value="DIPLOME">Diplôme</option></Choix>
        </Champ>
        <Champ label="Fichier">
          <Entree type="file" name="fichier" required />
        </Champ>
        <Bouton type="submit" className="w-full">Déposer</Bouton>
      </form>
    </Fenetre>
  );
}