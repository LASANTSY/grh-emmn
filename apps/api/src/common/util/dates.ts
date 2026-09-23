/**
 * Normalisation des dates reçues au format chaîne (ex. `2020-05-14`)
 * vers des instances Date acceptées par Prisma. Les valeurs vides/absent
 * restent null/undefined. Utilitaire métier de l'API (JSON ne transporte pas
 * de Date).
 */
export function normaliserDates(
  donnees: Record<string, unknown>,
  champs: string[],
): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(donnees)) {
    if (champs.includes(cle) && (typeof valeur === 'string' || valeur === null)) {
      if (!valeur) {
        sortie[cle] = null;
        continue;
      }
      const d = new Date(valeur as string);
      sortie[cle] = Number.isNaN(d.getTime()) ? null : d;
    } else {
      sortie[cle] = valeur;
    }
  }
  return sortie;
}

export const CHAMPS_DATE_PERSONNEL = [
  'dateNaissance', 'dateDelivranceCIN', 'dateDuplicataCIN', 'dateDelivrancePasseport',
  'dateAutorisationMariage', 'dateNaissanceConjoint', 'dateDelivranceCIM',
  'dateEffetSOC_HDRC', 'dateEffetPrimeTechnicite', 'datePermisCivil',
  'datePermisMilitaire', 'dateEntreeService', 'dateLiberationServiceNational',
  'datePremierRengagement',
];

export const CHAMPS_DATE_ONGLET: Record<string, string[]> = {
  enfant: ['dateNaissance'],
  historiqueGrade: ['datePriseCommandement'],
  cursusScolaire: ['dateDebut', 'dateFin'],
  stageMilitaire: ['dateDebut', 'dateFin'],
  competenceLinguistique: [],
  affectation: ['dateEffet'],
  decoration: ['dateEffet'],
};