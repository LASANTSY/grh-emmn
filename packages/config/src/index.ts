// Constantes métier partagées (packages/config)
// Source : Cahier des charges §2, Analyse UML, Jeu de données (limites d'âge).

export const GRADE_CATEGORIES = [
  'OFFICIER_GENERAL',
  'OFFICIER_MARINE',
  'OFFICIER_MARINIER',
  'QMO',
] as const;

export type GradeCategorie = (typeof GRADE_CATEGORIES)[number];

export const TYPE_COMPTES = [
  'ADMIN_SYSTEME',
  'RH_ETAT_MAJOR',
  'RH_BASE',
  'CHEF_COMMANDEMENT',
  'PERSONNEL',
] as const;

export type TypeCompte = (typeof TYPE_COMPTES)[number];

export const NIVEAU_COMPETENCE = ['AVANCE', 'MOYEN', 'MAUVAIS'] as const;

export const STATUT_DEMANDE = ['EN_ATTENTE', 'VALIDEE', 'REJETEE'] as const;

export const ACTION_AUDIT = [
  'CREATION',
  'MODIFICATION',
  'SUPPRESSION',
  'CONNEXION',
  'ECHEC_CONNEXION',
  'IMPORT',
  'EXPORT',
  'VALIDATION',
  'REJET',
  'TELEVERSEMENT',
  'TELECHARGEMENT',
  'CHANGEMENT_PERMISSION',
  'CHANGEMENT_COMPTE',
] as const;

// Codes couleur du CDC §2.3 : rouge = retraite dans les 2 ans, jaune = dans
// l'année en cours, gris = déjà retraité. Au-delà de 2 ans : aucune alerte.
export const FIN_DE_LIEN = {
  DANS_1_AN: 'DANS_1_AN', // jaune : année en cours
  DANS_2_ANS: 'DANS_2_ANS', // rouge : dans les 2 ans
  RETRAITE: 'RETRAITE', // gris : déjà atteint la limite
  AUCUNE: 'AUCUNE',
} as const;

export type StatutFinDeLien = (typeof FIN_DE_LIEN)[keyof typeof FIN_DE_LIEN];

// Champs que la hiérarchie « Chef/Commandement » peut voir sans restriction ;
// utilisé notamment pour la consultation des fiches (culture militaire).
export const CHAMPS_SENSIBLES_AGENT = [
  'grade',
  'matriculeRecrutement',
  'matriculeFinancier',
  'corps',
  'specialite',
  'affectations',
  'decorations',
  'situationMilitaire',
  'numeroCIM',
  'dateEntreeService',
  'decisions',
] as const;
export { calculerFinDeLien } from './fin-de-lien';
