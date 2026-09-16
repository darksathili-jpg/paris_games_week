# PGW NSI Quest 2026

Application web pédagogique conçue pour accompagner une classe de **Terminale NSI du lycée Watteau de Valenciennes** lors de la **Paris Games Week 2026**, le 23 octobre 2026.

La visite est organisée sous la forme de six missions progressives : observation, formations, code, innovation, rencontre professionnelle et synthèse finale. L'application fonctionne selon une architecture **local-first** : le travail de l'élève est sauvegardé immédiatement dans le navigateur puis synchronisé vers Supabase lorsque le réseau est disponible.

## État du projet

- **Version : V8.17 — Release Candidate RC1**
- **Release Gate renforcé : validé**
- **Branche gelée : `release/pgw-2026-rc1`**
- **6 missions / 61 questions / 6 badges / 1350 XP**
- **Responsive : mobile 390 px, tablette 760 px, desktop 1440 px**
- **GitHub Pages : déploiement automatique**
- **Backend : Supabase Auth + PostgreSQL + RLS**

La Release Candidate RC1 est documentée dans [`RELEASE_CANDIDATE_V8.md`](RELEASE_CANDIDATE_V8.md).

## Accès

- Application élève : https://darksathili-jpg.github.io/paris_games_week/
- Version V8 directe : https://darksathili-jpg.github.io/paris_games_week/preview-v8.html
- Cockpit enseignant : https://darksathili-jpg.github.io/paris_games_week/teacher.html

## Fonctionnalités principales

### Élève

- six missions à déverrouillage séquentiel ;
- XP, badges et rang de progression ;
- autosauvegarde de chaque réponse avant validation ;
- copie locale de secours en cas de corruption de l'état principal ;
- fonctionnement sans réseau après chargement de la page ;
- file de synchronisation persistante et idempotente ;
- reprise automatique après coupure réseau ;
- session Supabase anonyme durable après fermeture/réouverture du navigateur ;
- renouvellement contrôlé du token d'accès sans recréer inutilement un utilisateur ;
- indicateur explicite de l'état de synchronisation et contrôle avant départ.

### Enseignant

- authentification par compte enseignant ;
- lecture des progressions et des réponses autorisées par les politiques RLS ;
- contrôle de fraîcheur des dernières remontées ;
- fermeture des nouvelles inscriptions sans bloquer la synchronisation des élèves déjà reliés ;
- export CSV final.

## Architecture

```text
.
├── preview-v8.html            # application élève V8
├── teacher.html               # cockpit enseignant
├── config.js                  # configuration publique du frontend enseignant
├── config.example.js          # exemple de configuration
├── assets/
│   └── v8/                    # masters et dérivés AVIF/WebP validés
├── css/
│   ├── v8-components.css
│   ├── v8-responsive.css
│   ├── v8-motion.css
│   ├── v8-tokens.css
│   └── teacher-v8.css
├── js/
│   ├── content.js             # contenu pédagogique des 6 missions
│   ├── v8-app.js              # moteur de progression et UI élève
│   ├── v8-session.js          # session Auth durable / refresh
│   ├── v8-sync.js             # queue local-first et reprise réseau
│   ├── v8-supabase.js         # Data API Supabase
│   ├── v8-join.js             # liaison élève / sortie
│   ├── v8-quality.js          # contrôles runtime
│   ├── teacher.js             # cockpit enseignant
│   └── supabase-client.js     # client Supabase enseignant
├── supabase/
│   ├── schema.sql
│   └── promote_teacher.sql
├── tests/                     # tests Playwright terrain et release
├── tools/                     # pipeline d'images et contrôles CI
└── .github/workflows/         # qualité et déploiement GitHub Pages
```

## Sécurité Supabase

Le frontend peut contenir l'URL du projet et une **clé publishable** Supabase : elles sont conçues pour être publiques. La sécurité repose sur les politiques **Row Level Security (RLS)** et sur l'identité Auth de l'utilisateur.

Ne jamais placer dans le dépôt ou dans le navigateur :

- `service_role` ;
- une clé `sb_secret_...` ;
- le mot de passe de la base PostgreSQL ;
- tout secret donnant des privilèges administrateur.

La configuration terrain actuelle utilise **60 connexions anonymes par heure** afin de conserver une marge lorsque plusieurs élèves partagent la même adresse IP publique.

## Installation locale

Prérequis : **Node.js 24**.

```bash
npm install
npm run serve:v8
```

Puis ouvrir :

```text
http://127.0.0.1:4173/preview-v8.html
```

## Tests et qualité

Le projet ne considère pas une version comme validée sur la seule base d'un contrôle visuel. Les Quality Gates couvrent notamment :

- validation des masters et génération AVIF/WebP ;
- parcours complet M01 → M06 ;
- verrouillage séquentiel ;
- autosauvegarde et restauration ;
- coupure réseau et reprise ;
- synchronisation Supabase idempotente ;
- durabilité et refresh de session ;
- répétition multi-appareils ;
- cockpit enseignant ;
- accessibilité automatisée et navigation clavier ;
- erreurs JavaScript et ressources locales en échec ;
- budget Lighthouse mobile.

Commandes utiles :

```bash
npm run images:validate
npm run images:build
npm run test:visual
```

Les workflows GitHub Actions exécutent ces contrôles automatiquement sur les modifications concernées.

## Pipeline graphique V8

Les six illustrations validées sont conservées dans `assets/v8/masters/`. Le pipeline génère les déclinaisons responsives en AVIF et WebP. Les masters sont gelés : ils ne doivent être remplacés qu'en présence d'un défaut bloquant reproduit.

Documents de référence :

- [`ART_DIRECTION_V8.md`](ART_DIRECTION_V8.md) — direction artistique ;
- [`IMAGE_PIPELINE_V8.md`](IMAGE_PIPELINE_V8.md) — pipeline des images ;
- [`V8_PRODUCTION_CONTRACT.md`](V8_PRODUCTION_CONTRACT.md) — contrat de non-régression ;
- [`FIELD_READINESS_V8.md`](FIELD_READINESS_V8.md) — historique des gates terrain ;
- [`PGW_REHEARSAL_V8.md`](PGW_REHEARSAL_V8.md) — répétition opérationnelle ;
- [`RELEASE_GATE_V8.md`](RELEASE_GATE_V8.md) — critères de release ;
- [`RELEASE_CANDIDATE_V8.md`](RELEASE_CANDIDATE_V8.md) — snapshot RC1 et politique de gel.

## Déploiement

Le dépôt est publié automatiquement avec **GitHub Pages** depuis la branche `main`. Le workflow reconstruit les dérivés d'images avant publication afin d'éviter qu'un master valide soit déployé sans ses formats responsives.

## Politique de release

RC1 est gelée. Après le gel :

- aucune nouvelle fonctionnalité ;
- aucune retouche esthétique sans défaut mesuré ;
- aucune modification du contenu pédagogique sur simple intuition ;
- seules les corrections P0/P1 reproductibles sont acceptées ;
- toute correction doit repasser l'intégralité des Quality Gates avant de devenir RC2 ou ultérieure.

Le pilote avec de vrais élèves a été volontairement annulé. Le risque résiduel accepté concerne donc uniquement la charge réelle de saisie des 61 questions ; il est documenté dans la Release Candidate.

## Contexte pédagogique

Projet réalisé pour les élèves de Terminale NSI du **lycée Watteau de Valenciennes**. L'objectif est de transformer la visite de la Paris Games Week en activité d'observation, d'investigation et de mise en relation avec l'informatique, les formations et les métiers du numérique.
