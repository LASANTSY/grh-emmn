# steps.md — Suivi du développement

## Terminé

- [x] Analyse des sources (CDC, UML, données) — Phase 1
- [x] Choix des technologies et architecture (docs/architecture/)
- [x] Environnement PostgreSQL local (Win Postgres 16 : user `postgres`, pwd `root1234`, db `grh_emmn`)
- [ ] Modèle Prisma + migrations
- [ ] API NestJS complète
- [ ] Frontend React complet
- [ ] Tests
- [ ] Docker

## En cours
- Architecture & docs → scaffold monorepo

## Décisions techniques documentées
| Sujet | Décision |
|---|---|
| BDD | PostgreSQL 16 fourni localement (Windows via localhost WSL) — bases : user `postgres`, pwd `root1234`, db `grh_emmn` |
| Prisma | Schéma unique à la racine `prisma/`, client généré à la racine, consommé par `apps/api` |
| Stockage fichiers | Interface `StorageService` : implémentation locale par défaut, S3/MinIO via S3 SDK (même contrat) |
| Types partagés | `packages/types` (DTO API), `packages/validation` (Zod), `packages/config` (constantes, catégories grades, retraite) |
| i18n | JSON par langue + domaine, fallback fr, react-i18next côté web |

## Problèmes rencontrés
- `sudo` indisponible (passwordless) : pas d'install apt de PostgreSQL/Docker → solution : PostgreSQL déjà présent sur l'hôte Windows (port 5432 partagé avec WSL), utilisé tel quel. Docker sera géré via Docker Desktop si activé.
- Skill `frontend-design` non disponible dans OpenCode : les principes de design de la spec §12-14 sont appliqués manuellement (documentés dans docs/ux/).