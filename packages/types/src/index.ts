// Types partagés entre apps/web et apps/api (couche contrat API).
import type {
  GradeCategorie,
  StatutFinDeLien,
  TypeCompte,
} from '@grh/config';

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- Référentiels ----------------------------------------------------------
export interface BaseDto {
  id: string;
  nom: string;
  ville?: string | null;
  code?: string | null;
  ordre: number;
  unites?: UniteDto[];
}

export interface UniteDto {
  id: string;
  nom: string;
  code?: string | null;
  ordre: number;
  baseId: string;
  base?: BaseDto;
}

export interface GradeDto {
  id: string;
  libelle: string;
  categorie: GradeCategorie;
  ageDepartRetraite: number;
  ordre: number;
}

export interface SpecialiteDto {
  id: string;
  libelle: string;
}

// --- Personnel ------------------------------------------------------------
export interface EnfantDto {
  id: string;
  rang: number;
  nom: string;
  prenoms?: string | null;
  dateNaissance?: string | null;
  sexe?: string | null;
  lienParente?: string | null;
}

export interface HistoriqueGradeDto {
  id: string;
  gradeId: string;
  grade?: GradeDto;
  referenceDecret?: string | null;
  datePriseCommandement?: string | null;
  observations?: string | null;
}

export interface CursusScolaireDto {
  id: string;
  etablissement: string;
  villePays?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  diplomeObtenu?: string | null;
}

export interface StageMilitaireDto {
  id: string;
  etablissement: string;
  lieu?: string | null;
  natureFormation?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  decisionEnvoi?: string | null;
  diplomeCertificat?: string | null;
}

export interface CompetenceLinguistiqueDto {
  id: string;
  langue: string;
  niveauEcrit: 'AVANCE' | 'MOYEN' | 'MAUVAIS';
  niveauParle: 'AVANCE' | 'MOYEN' | 'MAUVAIS';
}

export interface AffectationDto {
  id: string;
  uniteId: string;
  unite?: UniteDto;
  decision?: string | null;
  dateEffet?: string | null;
  fonctionEmploi?: string | null;
  observations?: string | null;
}

export interface DecorationDto {
  id: string;
  libelle: string;
  reference?: string | null;
  dateEffet?: string | null;
  observations?: string | null;
}

export interface VersionPieceJointeDto {
  id: string;
  fichier: string;
  format: string;
  tailleOctets: number;
  nomOriginal: string;
  mimeType: string;
  dateDepot: string;
}

export interface PieceJointeDto {
  id: string;
  type: string;
  dateAjout: string;
  versions: VersionPieceJointeDto[];
  versionActive?: VersionPieceJointeDto;
}

export interface InfoFinDeLienDto {
  statut: StatutFinDeLien;
  dateFinDeLien: string | null;
  ageDepart: number;
  enAlerte: boolean;
}

export interface PersonnelDto {
  id: string;
  matriculeRecrutement: string;
  matriculeFinancier?: string | null;
  nom: string;
  prenoms: string;
  photo?: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  prefecture?: string | null;
  sousPrefecture?: string | null;
  province?: string | null;
  email?: string | null;
  telephoneMobile?: string | null;
  numeroCIN?: string | null;
  dateDelivranceCIN?: string | null;
  lieuDelivranceCIN?: string | null;
  dateDuplicataCIN?: string | null;
  numeroPasseport?: string | null;
  dateDelivrancePasseport?: string | null;
  religion?: string | null;
  groupeSanguin?: string | null;
  taille?: string | null;
  adresseActuelle?: string | null;
  adresseRepli?: string | null;
  contactUrgence?: string | null;
  statutFamilial?: string | null;
  numeroAutorisationMariage?: string | null;
  dateAutorisationMariage?: string | null;
  nomConjoint?: string | null;
  dateNaissanceConjoint?: string | null;
  lieuNaissanceConjoint?: string | null;
  fonctionConjoint?: string | null;
  sportsPratiques?: string | null;
  nomPere?: string | null;
  nomMere?: string | null;
  corps?: string | null;
  lieuEmploi?: string | null;
  fonctionActuelle?: string | null;
  numeroCIM?: string | null;
  dateDelivranceCIM?: string | null;
  dateEffetSOC_HDRC?: string | null;
  referenceSOC_HDRC?: string | null;
  dateEffetPrimeTechnicite?: string | null;
  referencePrimeTechnicite?: string | null;
  numeroPermisCivil?: string | null;
  datePermisCivil?: string | null;
  numeroPermisMilitaire?: string | null;
  datePermisMilitaire?: string | null;
  situationMilitaire?: string | null;
  origineRecrutement?: string | null;
  dateEntreeService?: string | null;
  interruptionsService?: string | null;
  dateLiberationServiceNational?: string | null;
  datePremierRengagement?: string | null;
  niveauInstruction?: string | null;
  connaissancesInformatiques?: string | null;
  gradeId: string;
  grade?: GradeDto;
  uniteId: string;
  unite?: UniteDto & { base?: BaseDto };
  specialiteId?: string | null;
  specialite?: SpecialiteDto | null;
  // Relations (détail fiche)
  enfants?: EnfantDto[];
  historiqueGrades?: HistoriqueGradeDto[];
  cursusScolaire?: CursusScolaireDto[];
  stagesMilitaires?: StageMilitaireDto[];
  competencesLinguistiques?: CompetenceLinguistiqueDto[];
  affectations?: AffectationDto[];
  decorations?: DecorationDto[];
  piecesJointes?: PieceJointeDto[];
  // Calculs
  finDeLien?: InfoFinDeLienDto;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonnelSearchParams {
  q?: string;
  nom?: string;
  matricule?: string;
  gradeId?: string;
  uniteId?: string;
  baseId?: string;
  specialiteId?: string;
  categorie?: GradeCategorie;
  situationMilitaire?: string;
  corps?: string;
  finDeLien?: 'DANS_1_AN' | 'DANS_2_ANS' | 'RETRAITE';
  page?: number;
  pageSize?: number;
  tri?: string;
  ordre?: 'asc' | 'desc';
}

// --- Comptes / auth --------------------------------------------------------
export interface CompteDto {
  id: string;
  identifiant: string;
  typeCompte: TypeCompte;
  personnelId: string;
  uniteId?: string | null;
  actif: boolean;
  compteVerrouille: boolean;
  dateCreation: string;
  dateDernierAcces?: string | null;
  doitChangerMotDePasse: boolean;
  personnel?: Pick<PersonnelDto, 'id' | 'nom' | 'prenoms' | 'matriculeRecrutement'> | null;
}

export interface UserSession {
  compte: CompteDto;
  permissions: string[];
  perimetre: { type: 'GLOBAL' | 'BASE' | 'UNITE' | 'SOI'; uniteId?: string; baseId?: string };
}

// --- Demandes de modification ---------------------------------------------
export interface DemandeModificationDto {
  id: string;
  personnelId: string;
  compteId: string;
  champModifie: string;
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';
  dateDemande: string;
  dateTraitement?: string | null;
  commentaire?: string | null;
  personnel?: Pick<PersonnelDto, 'id' | 'nom' | 'prenoms' | 'matriculeRecrutement' | 'gradeId'> | null;
}

// --- Audit -----------------------------------------------------------------
export interface EntreeAuditDto {
  id: string;
  action: string;
  entite: string;
  entiteId?: string | null;
  champModifie?: string | null;
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
  personnelId?: string | null;
  compteId?: string | null;
  compte?: Pick<CompteDto, 'identifiant'> | null;
  details?: unknown;
  ip?: string | null;
  dateHeure: string;
}

// --- Import ----------------------------------------------------------------
export interface LigneImportDto {
  id: string;
  numeroLigne: number;
  statut: 'VALIDE' | 'ERREUR';
  actionAppliquee?: string | null;
  messageErreur?: string | null;
  personnelId?: string | null;
  donnees?: unknown;
}

export interface ImportPersonnelDto {
  id: string;
  dateImport: string;
  nomFichierSource: string;
  nombreLignes: number;
  nombreCrees: number;
  nombreMisesAJour: number;
  nombreErrors: number;
  statut: 'PREVUE' | 'REJETEE' | 'IMPORTEE' | 'PARTIELLE';
  compte?: Pick<CompteDto, 'identifiant'> | null;
  lignes?: LigneImportDto[];
}

export interface ImportPreviewResult {
  importId: string;
  totalLignes: number;
  erreurs: LigneImportDto[];
  valides: LigneImportDto[];
  doublonsCIN: number;
  doublonsMatricule: number;
  resume: { creer: number; mettreAJour: number; ignorer: number; erreurs: number };
}

// --- Dashboard -------------------------------------------------------------
export interface DashboardSynthese {
  totalPersonnels: number;
  parBase: { baseId: string; nom: string; total: number }[];
  parCategorie: { categorie: GradeCategorie; total: number }[];
  parSpecialite: { specialite: string; total: number }[];
  parSexe: { sexe: string; total: number }[];
  pyramideAges: { tranche: string; total: number }[];
  departsRetraite: { annee: number; total: number }[];
  evolutionEffectifs: { annee: number; total: number }[];
  finDeLien: {
    total: number;
    dans1An: number;
    dans2Ans: number;
    retraites: number;
    liste: Pick<PersonnelDto, 'id' | 'nom' | 'prenoms' | 'gradeId' | 'uniteId'>[];
  };
}

export interface DashboardAvecBase {
  synthese: DashboardSynthese;
  base: string | null;
}