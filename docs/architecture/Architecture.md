# Architecture technique — GRH EMMN

## Vue d'ensemble

Application web de gestion des ressources humaines de l'État-Major de la Marine Nationale (EMMN), destinée à remplacer la base Microsoft Access mono-poste existante.

```
React (Vite) ── HTTP/JSON ──> NestJS (API REST) ──> Prisma ──> PostgreSQL
      │                            │
      └──────(i18n fr/en/mg)───────┴────(stockage fichiers : local / S3)
```

## Monorepo

```
grh-emmn/
├── apps/
│   ├── web/                 # React + Vite + TypeScript + Tailwind + TanStack Query
│   └── api/                 # NestJS + Prisma
├── packages/
│   ├── types/               # Types partagés front/back
│   ├── validation/          # Schémas Zod partagés
│   └── config/              # Constantes communes (périmètres, catégories, enums)
├── prisma/                  # Schéma Prisma unique + migrations versionnées
├── docs/                    # Architecture, API, BDD, déploiement, UX
├── scripts/                 # Scripts dev (db, seed, etc.)
├── docker/                  # Dockerfiles + entrypoints
└── docker-compose.yml
```

## Choix techniques (justifiés)

| Sujet | Choix | Justification |
|---|---|---|
| Backend | NestJS, TypeScript | Modularité par domaine, injonction de la spec (§5), API REST stricte |
| ORM | Prisma | Migrations versionnées, type-safe, index/contraintes (spec §6) |
| BDD | PostgreSQL | Normalisation, recherche, intégrité référentielle, exigences CDC |
| Frontend | React + Vite | Injonction de la spec (§4.1), jamais Next.js |
| UI | Tailwind + composants maison type shadcn/ui | Design system maîtrisé, pas de dépendance lourde |
| Données formulaires | React Hook Form + Zod | Zod partagé front/back via `packages/validation` |
| État serveur | TanStack Query | Cache, invalidation précise, loading/error/empty |
| Graphiques | Recharts | Camemberts, pyramide des âges, histogrammes interactifs |
| i18n | react-i18next (JSON imbriqués) | fr/en/mg, fallback fr |
| Auth | JWT (access courte durée) sur cookie ou header | Sessions sécurisées, expiration, verrouillage |
| Stockage | Interface `StorageService` (local / S3/MinIO) | Spéc §7 |

## Modèle de données

Voir `docs/database/schema.md` et le schéma Prisma (`prisma/schema.prisma`).

## Sécurité (frontière = backend)

- Vérification JWT + RBAC sur chaque route.
- Contrôle du périmètre organisationnel (RH de base ne voit que sa base, chef limité à son niveau) implémenté dans les services, jamais uniquement dans le frontend.
- Validation Zod/DTO stricte, gestion centralisée des erreurs (`{ statusCode, code, message, details }`).
- Politique de mots de passe, verrouillage après échecs, réinitialisation sécurisée.
- Audit de toute action sensible.