import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  identifiant: z.string().min(1).max(100),
  motDePasse: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: z
    .string()
    .min(10, 'PASSWORD_TOO_SHORT')
    .max(200)
    .regex(/[a-z]/, 'PASSWORD_MISSING_LOWERCASE')
    .regex(/[A-Z]/, 'PASSWORD_MISSING_UPPERCASE')
    .regex(/[0-9]/, 'PASSWORD_MISSING_DIGIT'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Référentiels
// ---------------------------------------------------------------------------

export const baseSchema = z.object({
  nom: z.string().min(1, 'REQUIRED').max(200),
  ville: z.string().max(200).optional().nullable(),
  code: z.string().max(20).optional().nullable(),
  ordre: z.number().int().optional(),
});
export type BaseInput = z.infer<typeof baseSchema>;

export const uniteSchema = z.object({
  nom: z.string().min(1, 'REQUIRED').max(200),
  code: z.string().max(20).optional().nullable(),
  ordre: z.number().int().optional(),
  baseId: z.string().min(1, 'REQUIRED'),
});
export type UniteInput = z.infer<typeof uniteSchema>;

export const gradeSchema = z.object({
  libelle: z.string().min(1, 'REQUIRED').max(200),
  categorie: z.enum(['OFFICIER_GENERAL', 'OFFICIER_MARINE', 'OFFICIER_MARINIER', 'QMO']),
  ageDepartRetraite: z.number().int().min(40).max(70),
  ordre: z.number().int().optional(),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export const specialiteSchema = z.object({
  libelle: z.string().min(1, 'REQUIRED').max(200),
});
export type SpecialiteInput = z.infer<typeof specialiteSchema>;

// ---------------------------------------------------------------------------
// Personnel — sous-schémas par onglet
// ---------------------------------------------------------------------------

export const enfantSchema = z.object({
  id: z.string().optional(),
  rang: z.number().int().min(1),
  nom: z.string().min(1).max(200),
  prenoms: z.string().max(200).optional().nullable(),
  dateNaissance: z.string().optional().nullable(),
  sexe: z.string().max(20).optional().nullable(),
  lienParente: z.string().max(100).optional().nullable(),
});

export const historiqueGradeSchema = z.object({
  id: z.string().optional(),
  gradeId: z.string().min(1, 'REQUIRED'),
  referenceDecret: z.string().max(300).optional().nullable(),
  datePriseCommandement: z.string().optional().nullable(),
  observations: z.string().max(500).optional().nullable(),
});

export const cursusScolaireSchema = z.object({
  id: z.string().optional(),
  etablissement: z.string().min(1).max(300),
  villePays: z.string().max(200).optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  diplomeObtenu: z.string().max(300).optional().nullable(),
});

export const stageMilitaireSchema = z.object({
  id: z.string().optional(),
  etablissement: z.string().min(1).max(300),
  lieu: z.string().max(200).optional().nullable(),
  natureFormation: z.string().max(300).optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  decisionEnvoi: z.string().max(300).optional().nullable(),
  diplomeCertificat: z.string().max(300).optional().nullable(),
});

export const competenceLinguistiqueSchema = z.object({
  id: z.string().optional(),
  langue: z.string().min(1).max(100),
  niveauEcrit: z.enum(['AVANCE', 'MOYEN', 'MAUVAIS']),
  niveauParle: z.enum(['AVANCE', 'MOYEN', 'MAUVAIS']),
});

export const affectationSchema = z.object({
  id: z.string().optional(),
  uniteId: z.string().min(1, 'REQUIRED'),
  decision: z.string().max(300).optional().nullable(),
  dateEffet: z.string().optional().nullable(),
  fonctionEmploi: z.string().max(300).optional().nullable(),
  observations: z.string().max(500).optional().nullable(),
});

export const decorationSchema = z.object({
  id: z.string().optional(),
  libelle: z.string().min(1).max(300),
  reference: z.string().max(300).optional().nullable(),
  dateEffet: z.string().optional().nullable(),
  observations: z.string().max(500).optional().nullable(),
});

const dateNullable = z.string().optional().nullable();

// Formulaire complet de la fiche personnel (8 onglets).
export const personnelInputSchema = z.object({
  // Identité & infos générales
  matriculeRecrutement: z.string().min(1, 'REQUIRED').max(50),
  matriculeFinancier: z.string().max(50).optional().nullable(),
  nom: z.string().min(1, 'REQUIRED').max(200),
  prenoms: z.string().min(1, 'REQUIRED').max(200),
  gradeId: z.string().min(1, 'REQUIRED'),
  uniteId: z.string().min(1, 'REQUIRED'),
  specialiteId: z.string().optional().nullable(),
  email: z.string().email('EMAIL_INVALID').optional().nullish().transform(v => v || null),
  telephoneMobile: z.string().max(50).optional().nullable(),
  dateNaissance: dateNullable,
  lieuNaissance: z.string().max(200).optional().nullable(),
  prefecture: z.string().max(200).optional().nullable(),
  sousPrefecture: z.string().max(200).optional().nullable(),
  province: z.string().max(200).optional().nullable(),
  numeroCIN: z.string().max(50).optional().nullable(),
  dateDelivranceCIN: dateNullable,
  lieuDelivranceCIN: z.string().max(200).optional().nullable(),
  dateDuplicataCIN: dateNullable,
  numeroPasseport: z.string().max(50).optional().nullable(),
  dateDelivrancePasseport: dateNullable,
  religion: z.string().max(100).optional().nullable(),
  groupeSanguin: z.string().max(10).optional().nullable(),
  taille: z.union([z.number(), z.string()]).optional().nullish().transform(v => (v === null || v === undefined || v === '' ? null : Number(v))),
  adresseActuelle: z.string().max(500).optional().nullable(),
  adresseRepli: z.string().max(500).optional().nullable(),
  contactUrgence: z.string().max(500).optional().nullable(),
  statutFamilial: z.string().max(100).optional().nullable(),
  numeroAutorisationMariage: z.string().max(100).optional().nullable(),
  dateAutorisationMariage: dateNullable,
  nomConjoint: z.string().max(200).optional().nullable(),
  dateNaissanceConjoint: dateNullable,
  lieuNaissanceConjoint: z.string().max(200).optional().nullable(),
  fonctionConjoint: z.string().max(200).optional().nullable(),
  sportsPratiques: z.string().max(300).optional().nullable(),
  nomPere: z.string().max(200).optional().nullable(),
  nomMere: z.string().max(200).optional().nullable(),
  // Renseignements militaires
  corps: z.string().max(100).optional().nullable(),
  lieuEmploi: z.string().max(300).optional().nullable(),
  fonctionActuelle: z.string().max(300).optional().nullable(),
  numeroCIM: z.string().max(50).optional().nullable(),
  dateDelivranceCIM: dateNullable,
  dateEffetSOC_HDRC: dateNullable,
  referenceSOC_HDRC: z.string().max(200).optional().nullable(),
  dateEffetPrimeTechnicite: dateNullable,
  referencePrimeTechnicite: z.string().max(200).optional().nullable(),
  numeroPermisCivil: z.string().max(50).optional().nullable(),
  datePermisCivil: dateNullable,
  numeroPermisMilitaire: z.string().max(50).optional().nullable(),
  datePermisMilitaire: dateNullable,
  situationMilitaire: z.string().max(100).optional().nullable(),
  origineRecrutement: z.string().max(200).optional().nullable(),
  dateEntreeService: dateNullable,
  interruptionsService: z.string().max(500).optional().nullable(),
  dateLiberationServiceNational: dateNullable,
  datePremierRengagement: dateNullable,
  niveauInstruction: z.string().max(200).optional().nullable(),
  connaissancesInformatiques: z.string().max(500).optional().nullable(),
  // Historiques (onglets 2-7)
  enfants: z.array(enfantSchema).optional(),
  historiqueGrades: z.array(historiqueGradeSchema).optional(),
  cursusScolaire: z.array(cursusScolaireSchema).optional(),
  stagesMilitaires: z.array(stageMilitaireSchema).optional(),
  competencesLinguistiques: z.array(competenceLinguistiqueSchema).optional(),
  affectations: z.array(affectationSchema).optional(),
  decorations: z.array(decorationSchema).optional(),
});
export type PersonnelInput = z.infer<typeof personnelInputSchema>;

// ---------------------------------------------------------------------------
// Comptes & demandes
// ---------------------------------------------------------------------------

export const compteUtilisateurSchema = z.object({
  identifiant: z.string().min(3, 'REQUIRED').max(100),
  typeCompte: z.enum(['ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL']),
  uniteId: z.string().optional().nullable(),
  motDePasseProvisoire: z.string().min(10).max(200),
  actif: z.boolean().optional(),
});
export type CompteUtilisateurInput = z.infer<typeof compteUtilisateurSchema>;

export const demandeModificationSchema = z.object({
  champModifie: z.string().min(1).max(300),
  ancienneValeur: z.string().optional().nullable(),
  nouvelleValeur: z.string().optional().nullable(),
});
export type DemandeModificationInput = z.infer<typeof demandeModificationSchema>;