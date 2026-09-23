# Liste des API — GRH EMMN

Base URL : `/api`. Swagger : `/api/docs`.

## Auth
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | /auth/login | public | Connexion (rate-limit + verrouillage) |
| POST | /auth/logout | auth | Déconnexion |
| GET | /auth/me | auth | Profil + permissions courantes |
| PATCH | /auth/password | auth | Changement de mot de passe |
| POST | /auth/password/reset | admin | Réinitialisation sécurisée d'un compte |
| GET | /auth/first-login | – | (password provisoire) — géré dans login |

## Référentiels
| Méthode | Route | Rôle |
|---|---|---|
| GET/POST | /bases | ADMIN |
| PATCH/DELETE | /bases/:id | ADMIN |
| GET/POST | /unites | admin/rh (GET) — admin (POST) |
| PATCH/DELETE | /unites/:id | ADMIN |
| GET/POST | /grades | GET /* auth — POST admin |
| PATCH/DELETE | /grades/:id | ADMIN |
| GET/POST | /specialites | admin/rh — admin |
| PATCH/DELETE | /specialites/:id | ADMIN |

## Personnel
| Méthode | Route | Rôle |
|---|---|---|
| GET | /personnel | recherche + pagination + filtres |
| POST | /personnel | édition (périmètre) |
| GET | /personnel/:id | auth (périmètre) |
| GET | /personnel/:id/export | auth (périmètre) |
| PATCH | /personnel/:id | édition (périmètre) |
| DELETE | /personnel/:id | ADMIN/RH EM |
| POST | /personnel/:id/enfants | édition |
| PATCH | /personnel/:id/enfants/:eid | édition |
| DELETE | /personnel/:id/enfants/:eid | édition |
| POST/PATCH/DELETE | /personnel/:id/historique-grades | édition |
| POST/PATCH/DELETE | /personnel/:id/cursus | édition |
| POST/PATCH/DELETE | /personnel/:id/stages | édition |
| POST/PATCH/DELETE | /personnel/:id/langues | édition |
| POST/PATCH/DELETE | /personnel/:id/affectations | édition |
| POST/PATCH/DELETE | /personnel/:id/decorations | édition |
| GET | /personnel/doublons | édition | Détection doublons CIN/matricule |
| GET | /personnel/fin-de-lien | auth | Liste alerte fin de lien |

## Documents (pièces jointes)
| Méthode | Route |
|---|---|
| POST | /personnel/:id/pieces-jointes (multipart) |
| GET | /personnel/:id/pieces-jointes |
| GET | /pieces-jointes/:id/telecharger |
| GET | /pieces-jointes/:id/preview | 
| POST | /pieces-jointes/:id/versions |
| DELETE | /pieces-jointes/:id |

## Import / Export
| Méthode | Route |
|---|---|
| GET | /imports/gabarit (modèle .xlsx) |
| POST | /imports/preview (upload + analyse) |
| POST | /imports/:id/confirmer |
| GET | /imports, /imports/:id |
| GET | /personnel/export/excel (filtres recherche) |
| GET | /rapports/:type/excel | /rapports/:type/pdf |

## Dashboard & statistiques
| Méthode | Route |
|---|---|
| GET | /dashboard/synthese |
| GET | /dashboard/repartition-unites |
| GET | /dashboard/repartition-grades |
| GET | /dashboard/pyramide-ages |
| GET | /dashboard/departs-retraite |
| GET | /dashboard/evolution-effectifs |

## Comptes & workflow
| Méthode | Route |
|---|---|
| GET/POST | /utilisateurs |
| PATCH/DELETE | /utilisateurs/:id |
| POST | /utilisateurs/:id/reinitialiser |
| GET/POST | /demandes-modification |
| PATCH | /demandes-modification/:id/valider |
| PATCH | /demandes-modification/:id/rejeter |
| GET | /audit (admin) |

## Erreurs
Format uniforme : `{ statusCode, code, message, details?, path?, timestamp? }`.