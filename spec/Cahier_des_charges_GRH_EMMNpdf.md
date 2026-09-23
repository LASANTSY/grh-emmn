## Cahier des charges

Application web de Gestion des Ressources Humaines de l'État-Major de la Marine Nationale (EMMN)

## 1. Contexte et objectifs

Le Bureau des Ressources Humaines de l'État-Major de la Marine Nationale (EMMN), basé à Antananarivo, dispose actuellement d'une base de données Microsoft Access (mono-poste, développée en 2015) permettant de gérer les dossiers du personnel (officiers, officiers mariniers, QMO) de l'ensemble de la Marine Nationale, réparti sur :

- l'EMMN à Antananarivo (état-major) ;

- la BANA — Base Navale d'Antsiranana ;

- le 2ème BIMA — 2ème Bataillon d'Infanterie de la Marine, également à Antsiranana.

## Cet outil montre ses limites :

- Utilisable sur un seul poste à la fois (pas de travail simultané, risque de doublons/écrasement de données) ;

- Pas d'accès à distance ni de sauvegarde centralisée fiable ;

- Saisie manuelle fastidieuse, fiche par fiche ;

- Pas de traçabilité des modifications (qui a modifié quoi, et quand) ;

- Interface vieillissante, non sécurisée (mot de passe, droits d'accès non gérés) ;

- Risque de perte de données (fichier local, pas de vraie base serveur).

Objectif du projet : faire développer une application web moderne, sécurisée et multi-utilisateurs, reprenant l'intégralité des fonctionnalités de l'existant,


en les améliorant, et en ajoutant la possibilité d'importer le personnel en masse via des fichiers Excel.

## 2. Périmètre fonctionnel

## 2.1 Page d'accueil / tableau de bord

- Bandeau d'en-tête personnalisable (nom de l'unité, date du jour, logo) ;

- Raccourcis vers :

- Liste du personnel par catégorie de grade (Officiers Généraux, Officiers de Marine, Officiers Mariniers, QMO) ;

- Liste du personnel par base puis par unité, structurée ainsi :

- EMMN (Antananarivo) : services et bureaux de l'état-major ;

- BANA (Base Navale d'Antsiranana), unités : RC TROZONA, PC TSELATRA, PC MALAKY, Direction du Port Militaire, Unité Marine, EREN, CPS, DNMG (Détachement Naval Majunga), DNNB (Nosy Be), DNSM (Sainte-Marie), DNTL (Toliara), DNFD (Fort Dauphin), DNMK (Manakara) ;

- 2ème BIMA (Antsiranana), unités : CCS, 1er CIMA, 2ème CIMA, 3ème CIMA, CCMA.

- La liste des bases et unités doit être paramétrable (ajout/suppression sans intervention technique) ;

- Liste du personnel « en fin de lien » (situation de service / retraite) avec code couleur ;

- Recherche d'une personne (voir §2.4) ;

- Ajout d'un nouveau profil (saisie unitaire) ;

- Import en masse via Excel (nouveauté).

- Tableau de bord statistique moderne (nouveauté, priorité du stage) :

- Vue d'ensemble de l'effectif total des Forces Navales ;

- Diagramme camembert : répartition du personnel entre l'EMMN, la BANA et le 2ème BIMA, avec un second niveau de détail par unité au sein de chaque base ;


- Diagramme camembert : répartition par catégorie de grade (Officiers Généraux, Officiers de Marine, Officiers Mariniers, QMO) ;

- Comparaison possible « une base/unité » vs « ensemble du personnel » (ex. : sélectionner la BANA et voir sa répartition par grade/spécialité comparée à la moyenne générale de l'EMMN) ;

- Autres graphiques utiles : pyramide des âges, répartition hommes/femmes, nombre de départs à la retraite par année (histogramme), évolution des effectifs ;

- Graphiques interactifs (survol pour voir le détail, clic pour filtrer la liste correspondante) ;

- Design moderne, clair, adapté à une présentation à la hiérarchie.

## 2.2 Fiche individuelle du personnel

Reprendre l'ensemble des onglets existants, en conservant les champs identifiés dans la base actuelle :

## a) Informations générales

- Grade, date de prise de commandement (P/C du) ;

- Nom, Prénom(s), Photo ;

- Coordonnées : adresse e-mail, téléphone mobile ;

- Naissance : date et lieu, Préfecture / Sous-préfecture, Province (ou pays si né à l'étranger) ;

- Pièce d'identité : n° CIN, date et lieu de délivrance, date de duplicata ;

- Passeport : numéro, date de délivrance ;

- Religion, groupe sanguin, taille ;

- Adresses : actuelle, de repli, personne à contacter en cas d'accident ;

- Situation familiale : statut, n° et date d'autorisation de mariage, nom/date/lieu de naissance de la conjointe, fonction de la conjointe, nombre d'enfants ;

- Sport(s) pratiqué(s), nom du père, nom de la mère.

## b) Enfants à charge

- Tableau : rang, nom et prénoms, date de naissance, sexe, lien de parenté.

## c) Renseignements militaires


- Corps, matricule de recrutement, matricule financier, spécialité, lieu d'emploi, fonction actuelle ;

- CIM (n°, date de délivrance) ;

- SOC/HDRC (date d'effet, référence), prime de technicité (date d'effet, référence) ;

- Permis civil et militaire (n°, date) ;

- Situation militaire (officier de carrière, appelé, EVDL...), origine de recrutement ;

- Date d'entrée en service, interruptions de service, date de libération du service national, date de premier rengagement ;

- Historique des grades successifs (grade, référence du décret/décision, date de prise de commandement, observations).

## d) Études et formations

- Niveau d'instruction ;

- Cursus scolaire/universitaire (établissement, ville/pays, période, diplôme obtenu) ;

- Stages et formations militaires (établissement, lieu, nature de la formation, période, décision d'envoi, diplôme/certificat obtenu).

## e) Connaissances particulières

- Langues (écrit/parlé : avancé, moyen, mauvais) ;

- Connaissances informatiques.

## f) Affectations successives

- Lieu d'affectation, fonction/emploi, décision, date d'effet, observations — historique complet, non écrasé à chaque changement d'affectation.

## g) Décorations successives

- Libellé, référence et date d'effet, observations.

## h) Pièces jointes

- Téléversement de documents (CV, copie CIN, notes, fiche biographique, etc.), formats acceptés : PDF, JPG/PNG, DOC/DOCX ;

- Amélioration demandée : prévisualisation des fichiers sans les télécharger, limite de taille configurable, historique des versions.


## 2.3 États et éditions (reporting)

- Classement par grade : liste triée par grade avec sous-totaux, exportable en PDF/Excel ;

- Classement avec fin de lien de service : mise en évidence automatique par couleur (rouge = retraite dans les 2 ans, jaune = retraite dans l'année en cours, gris = déjà retraité) — logique de calcul automatique à partir de la date de naissance/grade et de la réglementation (âge de départ à la retraite selon le grade), avec alerte automatique (notification/e-mail) un an avant la date de fin de lien ;

- Personnel par unité : liste par unité avec effectif total ;

- Génération de fiches individuelles imprimables (PDF) reprenant l'ensemble du dossier.

## 2.4 Recherche

- Recherche multicritère : nom, matricule, grade, unité, spécialité, date de naissance, etc. ;

- Recherche « floue » tolérant les fautes de frappe ;

- Détection et gestion des doublons (le système actuel a un lien « Doublons » à reprendre et fiabiliser).

## 2.5 Import de personnel via fichier Excel (nouvelle fonctionnalité demandée)

- Mise à disposition d'un modèle de fichier Excel (.xlsx) téléchargeable, avec un onglet par bloc de données (infos générales, enfants, renseignements militaires, études, affectations, décorations) ou une structure à plat documentée ;

- Fonction d'import permettant de :

- 1. Téléverser le fichier Excel ;

- 2. Faire une prévisualisation des lignes à importer avant validation ;

- 3. Valider automatiquement chaque ligne (champs obligatoires, formats de date, valeurs autorisées pour les listes déroulantes comme le grade, l'unité, la situation familiale...) ;

- 4. Afficher un rapport d'erreurs ligne par ligne (ex. : « ligne 12 : grade invalide », « ligne 30 : CIN déjà existant ») sans bloquer l'import des lignes valides ;


- 5. Détecter les doublons (par CIN ou matricule) et proposer soit de créer une nouvelle fiche, soit de mettre à jour la fiche existante ;

- 6. Générer un historique des imports (qui a importé, quand, combien de lignes, fichier source conservé).

- Ce mécanisme doit fonctionner pour la création en masse et pour la mise à jour en masse (ex. mise à jour annuelle des affectations).

- Export également possible : pouvoir exporter tout ou partie de la base vers Excel (avec les filtres de recherche appliqués).

## 2.6 Gestion des droits d'accès et des comptes (nouveauté, absente de l'existant)

Chaque agent doit disposer d'un compte personnel (identifiant / mot de passe). Deux grandes familles de comptes sont demandées :

## a) Comptes « Administrateur / RH »

Destinés au RH de l'État-Major, au RH des bases (BANA, 2ème BIMA), ainsi qu'aux chefs (hiérarchie/commandement). Ils ont accès à l'ensemble des fonctionnalités de gestion, avec plusieurs niveaux possibles à affiner avec le tuteur/RH, par exemple :

- Administrateur système : gestion des comptes utilisateurs, des unités, des listes déroulantes (grades, spécialités...), paramétrage général, accès à l'import/export en masse ;

- RH État-Major : accès en lecture/écriture à l'ensemble du personnel, toutes unités confondues ; création, modification, suppression de fiches ; consultation de tous les états et statistiques ;

- RH de base/unité : mêmes droits que le RH État-Major, mais limités au personnel de sa propre base/unité (droit d'accès filtré par unité d'affectation) ;

- Chef/Commandement : accès en lecture seule à l'ensemble ou à une partie du personnel (selon son niveau de commandement), avec accès aux états et statistiques (effectifs, départs à la retraite, etc.), sans droit de modification.

## b) Comptes « Personnel » (comptes simples)

Destinés à chaque membre du personnel. Un compte simple permet de :


- Consulter et mettre à jour ses propres informations (ex. : téléphone, adresse, e-mail, situation familiale, pièces jointes personnelles...). Certains champs sensibles ou officiels (grade, matricule, décorations, affectations, décisions...) doivent rester non modifiables par l'agent lui- même et nécessiter une validation par le RH (workflow de validation : la modification proposée par l'agent passe en attente jusqu'à approbation RH) ;

- Rechercher les autres membres du personnel, mais en n'ayant accès qu'à un jeu limité d'informations publiques : grade, nom et prénoms, poste/fonction actuelle, unité, téléphone (professionnel), et éventuellement photo — à l'exclusion de toute donnée personnelle, familiale, médicale (groupe sanguin), ou de dossier (décorations, notes, pièces jointes, etc.) ;

- Ne pas pouvoir consulter ni modifier le dossier complet d'un autre agent.

## c) Règles transverses

- Le détail exact des champs visibles/modifiables par profil devra être formalisé dans un tableau des droits (matrice champ × rôle) validé avec le client avant développement ;

- Journal d'audit : traçabilité de toute création/modification/suppression, y compris les modifications proposées par les agents eux-mêmes en attente de validation (utilisateur, date/heure, champ modifié, ancienne/nouvelle valeur) ;

- Politique de mots de passe robuste, verrouillage après tentatives échouées, réinitialisation sécurisée ;

- Procédure de création de compte pour un nouvel agent (ex. : compte créé automatiquement lors de l'ajout de la fiche personnel, ou lors de l'import Excel, avec envoi d'un identifiant/mot de passe provisoire).

## 3. Exigences non fonctionnelles

| Thème | Exigence |
| --- | --- |
| Hébergement À définir avec le tuteur/RH : serveur interne (on-premise, |   |
|   | recommandé pour des données sensibles de défense) |


| Thème | Exigence |
| --- | --- |
|   | ou hébergement cloud sécurisé. Le stagiaire présentera |
|   | les deux options avec leurs avantages/inconvénients. |
|   | Chiffrement des données sensibles, connexion en |
| Sécurité | HTTPS, sauvegardes automatiques quotidiennes, plan |
|   | de reprise après sinistre. |
|   | Les données étant à caractère personnel et militaire, |
| Confidentialité | une attention particulière doit être portée à la protection |
|   | des données (accès restreint, export contrôlé, mentions |
|   | légales). |
|   | Plusieururs utilisateurs doivent pouvoir travailler |
| Multi-utilisateur | simultanément sans écrasement de données. |
|   | Application accessible depuis un navigateur standard |
| Compatibilité | (Chrome, Edge, Firefox), idéalement responsive |
|   | (utilisable sur tablette). |
|   | Recherche et affichage de listes de plusieurs centaines |
| Performance | de fiches en moins de 2 secondes. |
|   | Code documenté, architecture modulaire, listes de |
| Maintenabilité | référence (grades, unités, spécialités...) administrables |
|   | sans développement. |
|   | Interface en français (option malgache/anglais en |
| Langue | bonus). |
| Formation & | Manuel utilisateur, manuel administrateur, session(s) de |
| documentation | formation des agents RH. |

## 4. Architecture technique (à titre indicatif, laissée au choix argumenté du stagiaire, en accord avec son tuteur)

- Frontend : application web responsive (ex. React, Vue, ou équivalent) ;


- Backend : API REST sécurisée (ex. Node.js, PHP/Laravel, Python/Django...) ;

- Base de données : SGBD relationnel robuste (PostgreSQL ou MySQL/MariaDB), avec modèle de données normalisé (tables Personnel, Enfants, Affectations, Décorations, Formations, Unités, Grades, Utilisateurs, Journal d'audit...) ;

- Import/Export Excel : bibliothèque serveur dédiée (ex. gestion native des .xlsx), traitement asynchrone pour les gros volumes ;

- Sauvegardes : automatisées, avec conservation d'un historique (ex. 30 jours glissants).

## 5. Reprise des données existantes

- Le stagiaire devra assurer la migration des données actuellement stockées dans la base Access existante (extraction, nettoyage, contrôle de cohérence, import dans la nouvelle base) ;

- Une phase de recette croisée (comparaison ancien/nouveau système) devra être réalisée avant bascule définitive.

## 6. Livrables attendus

- 1. Spécifications fonctionnelles détaillées (validées avant développement) ;

- 2. Maquettes/prototype navigable (validation ergonomie) ;

- 3. Application déployée en environnement de test (recette) ;

- 4. Application déployée en production ;

- 5. Script/outil de migration des données Access → nouvelle base ;

- 6. Modèle de fichier Excel pour l'import, avec sa notice d'utilisation ;

- 7. Documentation technique + manuels utilisateur et administrateur ;

- 8. Code source complet et droits associés ;

- 9. Formation des utilisateurs et de l'administrateur ;

- 10. Garantie / support post-livraison (durée à négocier, ex. 3 à 6 mois).


## 7. Planning indicatif — stage de 3 mois (12 semaines)

Le projet sera confié à un(e) étudiant(e) stagiaire, sur une durée de 3 mois. Le périmètre est donc volontairement priorisé : le cœur du système (fiches personnel + import Excel + tableau de bord statistique) doit être fonctionnel en fin de stage ; les fonctionnalités les plus lourdes (droits d'accès fins multi-niveaux, workflow de validation, etc.) pourront être livrées en version simplifiée, avec des pistes d'amélioration documentées pour la suite.

| Semaine(s) Étape | Détail |
| --- | --- |
|   | Étude de l'existant (base Access), entretiens |
| Cadrage & | avec le RH, rédaction du modèle de données, |
| Semaine 1 prise en main | choix des technologies |
|   | (frontend/backend/BDD), mise en place de |
|   | l'environnement de développement. |
|   | Maquettes (wireframes) des écrans principaux : |
| Semaine 2 Maquettage | accueil/dashboard, fiche personnel, recherche, |
|   | import Excel. Validation avec le client avant de |
|   | coder. |
|   | Création de la base de données (personnel, |
| Base de | enfants, affectations, décorations, formations, |
| Semaines données & | unités, grades, utilisateurs). Authentification |
| 3-4 |   |
|   | authentification simple (connexion, session) avec au moins 2 |
|   | profils : Admin/RH et Personnel. |
|   | Création/consultation/modification/suppression |
| Module Fiche Semaines | d'une fiche personnel avec tous les onglets |
| personnel 5-6 | (infos générales, enfants, militaire, formations, |
| (CRUD) | langues, affectations, décorations, pièces |
|   | jointes). |
| Recherche & | Recherche multicritère, liste par grade, liste par |
| Semaine 7 listes | unité, liste avec fin de lien (code couleur). |
| Import/Export Semaines | Modèle de fichier Excel, import avec |
| Excel 8-9 | prévisualisation et rapport d'erreurs, gestion des |
|   | doublons, export Excel/PDF des listes. |


| Semaine(s) Étape |   | Détail |
| --- | --- | --- |
|   | Tableau de | Graphiques (camemberts par unité et par grade, |
| Semaines | bord | comparaison unité vs ensemble, pyramide des |
| 10-11 |   | âges, alertes retraite), avec bibliothèque de |
|   | statistique | graphiques interactifs. |
|   | Tests, | Tests globaux, correction des bugs, migration |
| Semaine | corrections, | d'un échantillon (ou de l'intégralité si le temps le |
| 12 | migration & | permet) des données Access existantes, |
|   |   | rédaction d'un mini-manuel utilisateur, |
|   | livraison | présentation finale et remise du code source. |

## Points d'attention pour un planning de stage :

- Prévoir un point d'avancement hebdomadaire avec le tuteur/RH pour ajuster le périmètre si nécessaire ;

- Donner la priorité aux fonctionnalités à forte valeur immédiate : fiche personnel complète, import Excel, dashboard avec camemberts ;

- Les éléments les plus complexes (droits d'accès très fins par unité, workflow de validation des modifications par les agents, journal d'audit détaillé) peuvent être livrés en version basique, avec une liste claire d'évolutions possibles remise en fin de stage ;

- Le stagiaire devra documenter son code afin qu'un futur développeur puisse reprendre le projet facilement.

## 8. Annexe — Liste des champs identifiés dans le système actuel (référence pour le cadrage)

(Cette liste sert de base de discussion avec le stagiaire et son tuteur ; elle pourra être enrichie ou simplifiée lors de la phase de cadrage.)

- Identité : Grade, Nom, Prénoms, Photo, Date/lieu de naissance, Préfecture, Sous-préfecture, Province ;

- Pièces : CIN (n°, date, lieu, duplicata), Passeport (n°, date de délivrance) ;

- Contact : e-mail, téléphone, adresse actuelle, adresse de repli, contact d'urgence ;


- Vie personnelle : religion, groupe sanguin, taille, sport(s) pratiqué(s), nom du père/mère ;

- Situation familiale : statut, autorisation de mariage, conjoint(e), enfants (rang, nom, date de naissance, sexe, lien) ;

- Carrière militaire : corps, matricules, spécialité, lieu d'emploi, fonction actuelle, CIM, primes, permis civil/militaire, situation militaire, dates de service, historique des grades ;

- Formation : niveau d'instruction, cursus scolaire/universitaire, stages/formations militaires ;

- Compétences : langues (écrit/parlé), informatique ;

- Carrière : affectations successives (lieu, fonction, décision, date d'effet) ;

- Distinctions : décorations successives (libellé, référence, date, observations) ;

- Documents : pièces jointes diverses (CV, CIN, notes, fiches biographiques...).

Document préparé pour servir de cadre de travail au stagiaire ; il devra être affiné conjointement avec le tuteur/RH lors de la phase de cadrage détaillé (semaine 1 du stage).
