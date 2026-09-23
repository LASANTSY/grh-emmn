# Matrice des rôles (RBAC) — GRH EMMN

## Profils (énum `TypeCompte`)

| Profil | Code | Périmètre | Nature |
|---|---|---|---|
| Administrateur système | `ADMIN_SYSTEME` | global | plein |
| RH État-Major | `RH_ETAT_MAJOR` | global | édition |
| RH de base | `RH_BASE` | sa base (`uniteId` = base ou unité) | édition filtrée |
| Chef / Commandement | `CHEF_COMMANDEMENT` | sa base/unité ou global selon périmètre | lecture seule |
| Personnel | `PERSONNEL` | sa propre fiche | lecture + demande de modification |

## Matrice par domaine (✓ lecture / ✎ écriture / – interdit)

| Domaine | ADMIN_SYSTEME | RH_ETAT_MAJOR | RH_BASE | CHEF | PERSONNEL |
|---|---|---|---|---|---|
| Base / Unité / Grade / Spécialité | ✓✎ | ✓ | ✓ | ✓ | – |
| Comptes utilisateurs | ✓✎ | ✓✎ (sans admin) | – | – | – |
| Personnel : dossier complet | ✓✎ | ✓✎ | ✓✎ (périmètre) | ✓ | propre fiche ✓ |
| Personnel : champs sensibles (grade, matricule, affectation, décisions) | ✓✎ | ✓✎ | ✓✎ (périmètre) | ✓ | lecture seule |
| Enfants, formations, langues, décorations | ✓✎ | ✓✎ | ✓✎ | ✓ | lecture seule |
| Pièces jointes | ✓✎ | ✓✎ | ✓✎ | ✓ | propres PJ ✓✎ |
| Recherche « publique » (grade/nom/fonction/unité/tél) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Import / Export Excel | ✓✎ | ✓✎ | ✓✎ (périmètre) | – | – |
| Demande de modification | ✓✎ (validation) | ✓✎ (validation) | ✓✎ (validation périmètre) | – | création seule |
| Audit | ✓ | ✓ | – | – | – |
| Paramètres | ✓✎ | ✓ | – | – | – |
| États / Statistiques | ✓ | ✓ | ✓ (périmètre) | ✓ (périmètre) | – |

## Note

Matrice champ × rôle fin détaillée à affiner avec le RH (CDC §2.6c). Le backend applique cette
matrice via des guards (`RolesGuard`) et un contrôle de périmètre (`ScopeGuard` / vérification
d'unité dans les services).