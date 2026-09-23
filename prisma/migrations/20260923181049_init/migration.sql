-- CreateEnum
CREATE TYPE "GradeCategorie" AS ENUM ('OFFICIER_GENERAL', 'OFFICIER_MARINE', 'OFFICIER_MARINIER', 'QMO');

-- CreateEnum
CREATE TYPE "NiveauCompetence" AS ENUM ('AVANCE', 'MOYEN', 'MAUVAIS');

-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('ADMIN_SYSTEME', 'RH_ETAT_MAJOR', 'RH_BASE', 'CHEF_COMMANDEMENT', 'PERSONNEL');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "StatutLigneImport" AS ENUM ('VALIDE', 'ERREUR');

-- CreateEnum
CREATE TYPE "ActionImport" AS ENUM ('CREATION', 'MISE_A_JOUR', 'IGNOREE', 'ERREUR');

-- CreateEnum
CREATE TYPE "StatutImport" AS ENUM ('PREVUE', 'REJETEE', 'IMPORTEE', 'PARTIELLE');

-- CreateEnum
CREATE TYPE "ActionAudit" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'CONNEXION', 'ECHEC_CONNEXION', 'IMPORT', 'EXPORT', 'VALIDATION', 'REJET', 'TELEVERSEMENT', 'TELECHARGEMENT', 'CHANGEMENT_PERMISSION', 'CHANGEMENT_COMPTE');

-- CreateTable
CREATE TABLE "Base" (
    "id" TEXT NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "ville" VARCHAR(200),
    "code" VARCHAR(20),
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unite" (
    "id" TEXT NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "code" VARCHAR(20),
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "baseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "libelle" VARCHAR(200) NOT NULL,
    "categorie" "GradeCategorie" NOT NULL,
    "ageDepartRetraite" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialite" (
    "id" TEXT NOT NULL,
    "libelle" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL,
    "matriculeRecrutement" VARCHAR(50) NOT NULL,
    "matriculeFinancier" VARCHAR(50),
    "nom" VARCHAR(200) NOT NULL,
    "prenoms" VARCHAR(200) NOT NULL,
    "photo" VARCHAR(500),
    "dateNaissance" DATE,
    "lieuNaissance" VARCHAR(200),
    "prefecture" VARCHAR(200),
    "sousPrefecture" VARCHAR(200),
    "province" VARCHAR(200),
    "email" VARCHAR(200),
    "telephoneMobile" VARCHAR(50),
    "numeroCIN" VARCHAR(50),
    "dateDelivranceCIN" DATE,
    "lieuDelivranceCIN" VARCHAR(200),
    "dateDuplicataCIN" DATE,
    "numeroPasseport" VARCHAR(50),
    "dateDelivrancePasseport" DATE,
    "religion" VARCHAR(100),
    "groupeSanguin" VARCHAR(10),
    "taille" DECIMAL(5,2),
    "adresseActuelle" VARCHAR(500),
    "adresseRepli" VARCHAR(500),
    "contactUrgence" VARCHAR(500),
    "statutFamilial" VARCHAR(100),
    "numeroAutorisationMariage" VARCHAR(100),
    "dateAutorisationMariage" DATE,
    "nomConjoint" VARCHAR(200),
    "dateNaissanceConjoint" DATE,
    "lieuNaissanceConjoint" VARCHAR(200),
    "fonctionConjoint" VARCHAR(200),
    "sportsPratiques" VARCHAR(300),
    "nomPere" VARCHAR(200),
    "nomMere" VARCHAR(200),
    "corps" VARCHAR(100),
    "lieuEmploi" VARCHAR(300),
    "fonctionActuelle" VARCHAR(300),
    "numeroCIM" VARCHAR(50),
    "dateDelivranceCIM" DATE,
    "dateEffetSOC_HDRC" DATE,
    "referenceSOC_HDRC" VARCHAR(200),
    "dateEffetPrimeTechnicite" DATE,
    "referencePrimeTechnicite" VARCHAR(200),
    "numeroPermisCivil" VARCHAR(50),
    "datePermisCivil" DATE,
    "numeroPermisMilitaire" VARCHAR(50),
    "datePermisMilitaire" DATE,
    "situationMilitaire" VARCHAR(100),
    "origineRecrutement" VARCHAR(200),
    "dateEntreeService" DATE,
    "interruptionsService" VARCHAR(500),
    "dateLiberationServiceNational" DATE,
    "datePremierRengagement" DATE,
    "niveauInstruction" VARCHAR(200),
    "connaissancesInformatiques" VARCHAR(500),
    "gradeId" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "specialiteId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enfant" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "rang" INTEGER NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "prenoms" VARCHAR(200),
    "dateNaissance" DATE,
    "sexe" VARCHAR(20),
    "lienParente" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enfant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueGrade" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "referenceDecret" VARCHAR(300),
    "datePriseCommandement" DATE,
    "observations" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoriqueGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursusScolaire" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "etablissement" VARCHAR(300) NOT NULL,
    "villePays" VARCHAR(200),
    "dateDebut" DATE,
    "dateFin" DATE,
    "diplomeObtenu" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CursusScolaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageMilitaire" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "etablissement" VARCHAR(300) NOT NULL,
    "lieu" VARCHAR(200),
    "natureFormation" VARCHAR(300),
    "dateDebut" DATE,
    "dateFin" DATE,
    "decisionEnvoi" VARCHAR(300),
    "diplomeCertificat" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageMilitaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenceLinguistique" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "langue" VARCHAR(100) NOT NULL,
    "niveauEcrit" "NiveauCompetence" NOT NULL,
    "niveauParle" "NiveauCompetence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetenceLinguistique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affectation" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "decision" VARCHAR(300),
    "dateEffet" DATE,
    "fonctionEmploi" VARCHAR(300),
    "observations" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decoration" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "libelle" VARCHAR(300) NOT NULL,
    "reference" VARCHAR(300),
    "dateEffet" DATE,
    "observations" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decoration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionPieceJointe" (
    "id" TEXT NOT NULL,
    "pieceJointeId" TEXT NOT NULL,
    "fichier" VARCHAR(500) NOT NULL,
    "format" VARCHAR(50) NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "nomOriginal" VARCHAR(300) NOT NULL,
    "mimeType" VARCHAR(150) NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deposeParId" TEXT,

    CONSTRAINT "VersionPieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteUtilisateur" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "identifiant" VARCHAR(100) NOT NULL,
    "motDePasseHash" VARCHAR(300) NOT NULL,
    "typeCompte" "TypeCompte" NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compteVerrouille" BOOLEAN NOT NULL DEFAULT false,
    "tentativesEchec" INTEGER NOT NULL DEFAULT 0,
    "dateVerrouillage" TIMESTAMP(3),
    "dateDernierAcces" TIMESTAMP(3),
    "doitChangerMotDePasse" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "uniteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteUtilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeModification" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "champModifie" VARCHAR(300) NOT NULL,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" TIMESTAMP(3),
    "valideParId" TEXT,
    "commentaire" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeModification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntreeAudit" (
    "id" TEXT NOT NULL,
    "action" "ActionAudit" NOT NULL,
    "entite" VARCHAR(100) NOT NULL,
    "entiteId" VARCHAR(100),
    "champModifie" VARCHAR(300),
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "personnelId" TEXT,
    "compteId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntreeAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportPersonnel" (
    "id" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "dateImport" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomFichierSource" VARCHAR(300) NOT NULL,
    "fichierStocke" VARCHAR(500),
    "nombreLignes" INTEGER NOT NULL DEFAULT 0,
    "nombreCrees" INTEGER NOT NULL DEFAULT 0,
    "nombreMisesAJour" INTEGER NOT NULL DEFAULT 0,
    "nombreErrors" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutImport" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportPersonnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneImport" (
    "id" TEXT NOT NULL,
    "importPersonnelId" TEXT NOT NULL,
    "numeroLigne" INTEGER NOT NULL,
    "statut" "StatutLigneImport" NOT NULL,
    "actionAppliquee" "ActionImport",
    "messageErreur" VARCHAR(1000),
    "personnelId" TEXT,
    "donnees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Base_code_key" ON "Base"("code");

-- CreateIndex
CREATE INDEX "Base_nom_idx" ON "Base"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Unite_code_key" ON "Unite"("code");

-- CreateIndex
CREATE INDEX "Unite_baseId_idx" ON "Unite"("baseId");

-- CreateIndex
CREATE INDEX "Unite_nom_idx" ON "Unite"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_libelle_key" ON "Grade"("libelle");

-- CreateIndex
CREATE INDEX "Grade_categorie_idx" ON "Grade"("categorie");

-- CreateIndex
CREATE UNIQUE INDEX "Specialite_libelle_key" ON "Specialite"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_matriculeRecrutement_key" ON "Personnel"("matriculeRecrutement");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_matriculeFinancier_key" ON "Personnel"("matriculeFinancier");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_numeroCIN_key" ON "Personnel"("numeroCIN");

-- CreateIndex
CREATE INDEX "Personnel_nom_prenoms_idx" ON "Personnel"("nom", "prenoms");

-- CreateIndex
CREATE INDEX "Personnel_gradeId_idx" ON "Personnel"("gradeId");

-- CreateIndex
CREATE INDEX "Personnel_uniteId_idx" ON "Personnel"("uniteId");

-- CreateIndex
CREATE INDEX "Personnel_specialiteId_idx" ON "Personnel"("specialiteId");

-- CreateIndex
CREATE INDEX "Personnel_dateNaissance_idx" ON "Personnel"("dateNaissance");

-- CreateIndex
CREATE INDEX "Personnel_deletedAt_idx" ON "Personnel"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_nom_prenoms_dateNaissance_key" ON "Personnel"("nom", "prenoms", "dateNaissance");

-- CreateIndex
CREATE INDEX "Enfant_personnelId_idx" ON "Enfant"("personnelId");

-- CreateIndex
CREATE INDEX "HistoriqueGrade_personnelId_idx" ON "HistoriqueGrade"("personnelId");

-- CreateIndex
CREATE INDEX "HistoriqueGrade_gradeId_idx" ON "HistoriqueGrade"("gradeId");

-- CreateIndex
CREATE INDEX "CursusScolaire_personnelId_idx" ON "CursusScolaire"("personnelId");

-- CreateIndex
CREATE INDEX "StageMilitaire_personnelId_idx" ON "StageMilitaire"("personnelId");

-- CreateIndex
CREATE INDEX "CompetenceLinguistique_personnelId_idx" ON "CompetenceLinguistique"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceLinguistique_personnelId_langue_key" ON "CompetenceLinguistique"("personnelId", "langue");

-- CreateIndex
CREATE INDEX "Affectation_personnelId_idx" ON "Affectation"("personnelId");

-- CreateIndex
CREATE INDEX "Affectation_uniteId_idx" ON "Affectation"("uniteId");

-- CreateIndex
CREATE INDEX "Decoration_personnelId_idx" ON "Decoration"("personnelId");

-- CreateIndex
CREATE INDEX "PieceJointe_personnelId_idx" ON "PieceJointe"("personnelId");

-- CreateIndex
CREATE INDEX "VersionPieceJointe_pieceJointeId_idx" ON "VersionPieceJointe"("pieceJointeId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteUtilisateur_personnelId_key" ON "CompteUtilisateur"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteUtilisateur_identifiant_key" ON "CompteUtilisateur"("identifiant");

-- CreateIndex
CREATE INDEX "CompteUtilisateur_typeCompte_idx" ON "CompteUtilisateur"("typeCompte");

-- CreateIndex
CREATE INDEX "DemandeModification_personnelId_idx" ON "DemandeModification"("personnelId");

-- CreateIndex
CREATE INDEX "DemandeModification_statut_idx" ON "DemandeModification"("statut");

-- CreateIndex
CREATE INDEX "EntreeAudit_personnelId_idx" ON "EntreeAudit"("personnelId");

-- CreateIndex
CREATE INDEX "EntreeAudit_compteId_idx" ON "EntreeAudit"("compteId");

-- CreateIndex
CREATE INDEX "EntreeAudit_action_idx" ON "EntreeAudit"("action");

-- CreateIndex
CREATE INDEX "EntreeAudit_dateHeure_idx" ON "EntreeAudit"("dateHeure");

-- CreateIndex
CREATE INDEX "ImportPersonnel_compteId_idx" ON "ImportPersonnel"("compteId");

-- CreateIndex
CREATE INDEX "ImportPersonnel_dateImport_idx" ON "ImportPersonnel"("dateImport");

-- CreateIndex
CREATE INDEX "LigneImport_importPersonnelId_idx" ON "LigneImport"("importPersonnelId");

-- CreateIndex
CREATE INDEX "LigneImport_personnelId_idx" ON "LigneImport"("personnelId");

-- AddForeignKey
ALTER TABLE "Unite" ADD CONSTRAINT "Unite_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_specialiteId_fkey" FOREIGN KEY ("specialiteId") REFERENCES "Specialite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enfant" ADD CONSTRAINT "Enfant_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueGrade" ADD CONSTRAINT "HistoriqueGrade_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueGrade" ADD CONSTRAINT "HistoriqueGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursusScolaire" ADD CONSTRAINT "CursusScolaire_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageMilitaire" ADD CONSTRAINT "StageMilitaire_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenceLinguistique" ADD CONSTRAINT "CompetenceLinguistique_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affectation" ADD CONSTRAINT "Affectation_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affectation" ADD CONSTRAINT "Affectation_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decoration" ADD CONSTRAINT "Decoration_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionPieceJointe" ADD CONSTRAINT "VersionPieceJointe_pieceJointeId_fkey" FOREIGN KEY ("pieceJointeId") REFERENCES "PieceJointe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionPieceJointe" ADD CONSTRAINT "VersionPieceJointe_deposeParId_fkey" FOREIGN KEY ("deposeParId") REFERENCES "CompteUtilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteUtilisateur" ADD CONSTRAINT "CompteUtilisateur_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteUtilisateur" ADD CONSTRAINT "CompteUtilisateur_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeModification" ADD CONSTRAINT "DemandeModification_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeModification" ADD CONSTRAINT "DemandeModification_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteUtilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeModification" ADD CONSTRAINT "DemandeModification_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "CompteUtilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeAudit" ADD CONSTRAINT "EntreeAudit_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeAudit" ADD CONSTRAINT "EntreeAudit_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteUtilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportPersonnel" ADD CONSTRAINT "ImportPersonnel_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteUtilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneImport" ADD CONSTRAINT "LigneImport_importPersonnelId_fkey" FOREIGN KEY ("importPersonnelId") REFERENCES "ImportPersonnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneImport" ADD CONSTRAINT "LigneImport_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
