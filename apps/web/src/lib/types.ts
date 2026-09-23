export type TypeCompte = 'ADMIN_SYSTEME' | 'RH_ETAT_MAJOR' | 'RH_BASE' | 'CHEF_COMMANDEMENT' | 'PERSONNEL';
export type GradeCategorie = 'OFFICIER_GENERAL' | 'OFFICIER_MARINE' | 'OFFICIER_MARINIER' | 'QMO';

export interface Perimetre {
  baseId: string | null;
  uniteId: string | null;
}

export interface CompteMe {
  id: string;
  identifiant: string;
  typeCompte: TypeCompte;
  personnelId: string | null;
  perimetre: Perimetre;
}

export interface LoginResponse {
  compte: CompteMe;
  doitChangerMotDePasse: boolean;
}

export interface Grade {
  id: string;
  libelle: string;
  categorie: GradeCategorie;
  ageDepartRetraite: number;
  ordre: number;
}

export interface Base {
  id: string;
  nom: string;
  ville: string | null;
  code: string | null;
  unites?: Unite[];
}

export interface Unite {
  id: string;
  nom: string;
  code: string | null;
  baseId: string;
  base?: { nom: string };
}

export interface Specialite {
  id: string;
  libelle: string;
}

export interface FinDeLien {
  statut: 'DANS_1_AN' | 'DANS_2_ANS' | 'RETRAITE' | 'NEANT';
  dateFinDeLien: string | null;
  ageDepart: number;
  enAlerte: boolean;
}

export interface PersonnelLigne {
  id: string;
  matriculeRecrutement: string;
  matriculeFinancier: string | null;
  nom: string;
  prenoms: string;
  sexe: string | null;
  dateNaissance: string | null;
  email: string | null;
  telephoneMobile: string | null;
  situationMilitaire: string | null;
  grade: { libelle: string; categorie: GradeCategorie; ageDepartRetraite: number; ordre: number } | null;
  unite: { nom: string; base: { nom: string } } | null;
  specialite: { libelle: string } | null;
  finDeLien?: FinDeLien;
}

export interface ResultatsPage<T> {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface FinDeLienAlerte {
  id: string;
  matriculeRecrutement: string;
  nom: string;
  prenoms: string;
  sexe: string | null;
  dateNaissance: string | null;
  email: string | null;
  coût?: null;
  finDeLien?: FinDeLien;
  grade?: { libelle: string };
}

export interface Utilisateur {
  id: string;
  identifiant: string;
  typeCompte: TypeCompte;
  actif: boolean;
  compteVerrouille: boolean;
  doitChangerMotDePasse: boolean;
  dateCreation: string;
  dateDernierAcces: string | null;
  personnel?: { nom: string; prenoms: string };
}

export interface DemandeModification {
  id: string;
  personnelId: string;
  compteId: string;
  champModifie: string;
  ancienneValeur: string | null;
  nouvelleValeur: string | null;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';
  dateDemande: string;
  dateTraitement: string | null;
  commentaire: string | null;
  personnel?: { nom: string; prenoms: string; matriculeRecrutement: string };
  compte?: { identifiant: string };
  validePar?: { identifiant: string } | null;
}

export interface EntreeAudit {
  id: string;
  entiteId: string | null;
  dateHeure: string;
  action: string;
  entite: string;
  champModifie: string | null;
  ancienneValeur: string | null;
  nouvelleValeur: string | null;
  ip: string | null;
  compte?: { identifiant: string } | null;
  personnel?: { nom: string; prenoms: string } | null;
}

export interface ImportHistorique {
  id: string;
  nomFichierSource: string;
  statut: 'PREVUE' | 'IMPORTEE' | 'PARTIELLE' | 'REJETEE';
  nombreLignes: number;
  nombreCrees: number;
  nombreMisesAJour: number;
  nombreErrors: number;
  dateImportation?: string;
}

export interface AnalyseLigne {
  numeroLigne: number;
  erreursGroupees: string[];
  apercu: Record<string, string>;
}

export interface AnalyseImport {
  importId: string;
  total: number;
  valides: number;
  avecErreurs: number;
  lignes: AnalyseLigne[];
}