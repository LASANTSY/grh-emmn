-- Recherche « floue » : extension pg_trgm + index pour les sous-chaînes et
-- la similarité trigramme sur nom / prénoms / matricules (cf. CDC §2.4).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_personnel_nom_trgm" ON "Personnel" USING GIN (LOWER("nom") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_personnel_prenoms_trgm" ON "Personnel" USING GIN (LOWER("prenoms") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_personnel_matricule_trgm" ON "Personnel" USING GIN (LOWER("matriculeRecrutement") gin_trgm_ops);