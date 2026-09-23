# GRH — État-Major de la Marine Nationale Malgache

Système de **Gestion des Ressources Humaines** de la Direction des Ressources Humaines (DRH) de l'État-Major de la Marine Nationale (EMMN) de Madagascar.

> Monorepo : API REST **NestJS** + base **PostgreSQL/Prisma** + application web **React/Vite**. i18n français / anglais / malagasy.

## Fonctionnalités

- **Authentification & RBAC** : sessions (cookie `grh_token`, JWT + httpOnly), 5 profils (`ADMIN_SYSTEME`, `RH_ETAT_MAJOR`, `RH_BASE`, `CHEF_COMMANDEMENT`, `PERSONNEL`), périmètre de responsabilité (global / base / unité).
- **Gestion des effectifs** : fiches personnel (identité, situation militaire), grades, spécialités, onglets : enfants, historique de grades, cursus, stages, langues, affectations, décorations, pièces jointes.
- **Demandes de modification** : créées par le personnel, traitées (validées/rejetées) par la RH/administration avec traçabilité.
- **Import Excel** : gabarit téléchargeable, analyse du fichier (validation + erreurs), confirmation en lot (doublons = mise à jour).
- **Tableau de bord** : synthèse, répartition par grade/base/unité, pyramide des âges, évolution des recrutements, **alertes de fin de lien** (retraite planifiée à 1 an / 2 ans).
- **Journal d'audit** : historique des modifications (qui/quoi/quand/valeurs avant/après), export CSV.
- **Impression & rapports** : export des listes, état des effectifs (XLSX), rapport officiers / non-officiers (PDF).
- **Sécurité** : bcrypt (mot de passe), verrouillage de compte après échecs répétés, limitation de connexion.

## Architecture

```
├── apps/
│   ├── api/        # API REST NestJS (apps/api/src/modules/*)
│   └── web/        # Frontend React + Vite + Tailwind (apps/web/src)
├── packages/
│   ├── types/      # DTO partagés (contributions au contrat API)
│   ├── validation/ # Schémas Zod
│   └── config/     # Constantes, catégories de grades, règles (retraite…)
├── prisma/         # Schéma + migrations + seed partagés (racine)
├── scripts/seed.ts # Données de démonstration
├── docs/           # Architecture, BDD, UX, déploiement
└── docker/         # Infrastructure de déploiement (pg + api + web)
```

## Prérequis

- Node.js ≥ 20
- PostgreSQL 16 (locale ou Docker)
- npm ≥ 10

## Installation

```bash
npm install

# Copier et adapter les variables d'environnement
cp .env.example .env

# Base de données : appliquer le schéma puis charger les données de démonstration
export DATABASE_URL="postgresql://postgres:root1234@localhost:5432/grh_emmn"   # selon votre .env
prisma migrate deploy
npm run db:seed
```

## Démarrer en développement

```bash
npm run dev            # API (http://localhost:3001/api) + Web (http://localhost:5173)
npm run dev:api        # API seule — docs Swagger : http://localhost:3001/api/docs
npm run dev:web        # Web seule (proxy /api → :3001 et /storage → :3001)
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Lance API + Web simultanément |
| `npm run build` | Compile API (`dist/`) et Web (`apps/web/dist/`) |
| `npm run typecheck` | Vérification TypeScript des deux applications |
| `npm run lint` | ESLint API + Web (zéro warning) |
| `npm test` | Tests de l'API (Jest) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | Applique les migrations en base |
| `npm run db:seed` | Charge le jeu de données de démonstration |
| `npm run db:studio` | Interface Prisma Studio |

## Comptes de démonstration

Mot de passe commun : `EmMn@2026!Demo`

| Identifiant | Profil | Périmètre |
|---|---|---|
| `admin` | ADMIN_SYSTEME | Global |
| `rh.emm` | RH_ETAT_MAJOR | État-Major |
| `chef.emm` | CHEF_COMMANDEMENT | État-Major |
| `rh.bana` | RH_BASE | Base navale Antsiranana |
| `<matricule>` (ex. `MSA/2010/045`) | PERSONNEL | Unité de rattachement |

> Les comptes `PERSONNEL` créés via l'API reçoivent un mot de passe provisoire (visible
> dans la réponse) et doivent être changés à la première connexion.

## Configuration clé (`.env`)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `PORT=3001` | Port de l'API |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Signature / durée des sessions |
| `WEB_ORIGIN` | Origine CORS autorisée (dev : `http://localhost:5173`) |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES` | Verrouillage après échecs répétés |
| `STORAGE_DRIVER=local\|s3`, `UPLOAD_DIR` | Stockage des pièces jointes (local par défaut, S3/MinIO possible) |
| `MAX_FILE_SIZE_MB`, `ALLOWED_MIME` | Taille et types de fichiers autorisés |

## Conventions techniques

- Schéma Prisma unique à la racine, client généré à la racine et consommé par `apps/api`.
- Stockage fichier via une interface `StorageService` (implémentation locale ou S3 : même contrat).
- Les erreurs API suivent un format uniforme : `{ statusCode, code, message, path, timestamp }`.
- Codes d'erreur en majuscules (`HTTP_404`, `AUTH_*`, `IMPORT_*`, …), documentés dans Swagger.
- Fuseau par défaut : `Indian/Antananarivo`.

## Documentation

- `docs/architecture/` — choix techniques et conception
- `docs/database/` — modèle de données
- `docs/api/` — contrat API
- `docs/ux/` — principes d'interface
- `docs/deployment/` — procédure de déploiement