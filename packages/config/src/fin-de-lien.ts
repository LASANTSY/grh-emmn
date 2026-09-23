// Calculs métier partagés — fin de lien / retraite.
// Basé sur : grade.ageDepartRetraite (Jeu de données : limites d'âge par grade)
// et dateNaissance. Durée de service = âge atteint en années.

import type { StatutFinDeLien } from './index';
import { FIN_DE_LIEN } from './index';

export interface InfoFinDeLien {
  statut: StatutFinDeLien;
  dateFinDeLien: Date | null;
  ageDepart: number;
  enAlerte: boolean; // vrai si ≤ 2 ans (notification un an avant)
}

function ageEnAnnees(dateNaissance: Date, aDate: Date): number {
  let age = aDate.getFullYear() - dateNaissance.getFullYear();
  const m = aDate.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && aDate.getDate() < dateNaissance.getDate())) age--;
  return age;
}

/**
 * Calcule la date de fin de lien et le statut d'alerte.
 * config.approx = "year" (défaut) : alerte au 1er janvier de l'année civile
 *                     où le militaire atteint l'âge limite.
 *               = "exact" : alerte à la date anniversaire exacte.
 */
export function calculerFinDeLien(
  dateNaissance: Date | null | undefined,
  ageDepartRetraite: number | null | undefined,
  aujourdhui: Date = new Date(),
): InfoFinDeLien {
  const jamais: InfoFinDeLien = {
    statut: FIN_DE_LIEN.AUCUNE,
    dateFinDeLien: null,
    ageDepart: 0,
    enAlerte: false,
  };
  if (!dateNaissance || !ageDepartRetraite) return jamais;

  const dateFin = new Date(dateNaissance);
  dateFin.setFullYear(dateFin.getFullYear() + ageDepartRetraite);

  const ageActuel = ageEnAnnees(dateNaissance, aujourdhui);
  if (ageActuel >= ageDepartRetraite) {
    return { statut: FIN_DE_LIEN.RETRAITE, dateFinDeLien: dateFin, ageDepart: ageDepartRetraite, enAlerte: true };
  }

  const anneeAlerte = dateFin.getFullYear();
  const debutAnneeCible = new Date(anneeAlerte, 0, 1);
  const anneeCible = aujourdhui.getFullYear();
  const joursAvantAnneeCible = Math.ceil(
    (debutAnneeCible.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (anneeCible === anneeAlerte) {
    return {
      statut: FIN_DE_LIEN.DANS_1_AN,
      dateFinDeLien: dateFin,
      ageDepart: ageDepartRetraite,
      enAlerte: true,
    };
  }
  // Dans les 2 ans (année suivante ou avant l'année cible)
  if (joursAvantAnneeCible <= 365 * 2 && joursAvantAnneeCible > 0) {
    return {
      statut: FIN_DE_LIEN.DANS_2_ANS,
      dateFinDeLien: dateFin,
      ageDepart: ageDepartRetraite,
      enAlerte: true,
    };
  }
  return {
    statut: FIN_DE_LIEN.AUCUNE,
    dateFinDeLien: dateFin,
    ageDepart: ageDepartRetraite,
    enAlerte: false,
  };
}