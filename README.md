# PGW NSI Quest 2026

Application web pédagogique destinée aux élèves de **Terminale NSI du lycée Watteau de Valenciennes** pour la **Paris Games Week 2026**, le 23 octobre 2026.

PGW NSI Quest transforme la visite en parcours d'investigation : six missions progressives amènent les élèves à observer les technologies, interroger les formations et les professionnels, analyser des mécanismes informatiques et produire une synthèse finale.

## État du projet

- **Version : V8.17 — Release Candidate RC1**
- **Release Gate renforcé : validé**
- **Base technique : V8.16 Session Durability validée**
- **6 missions · 61 questions · 6 badges · 1350 XP**
- **Architecture local-first** avec synchronisation Supabase
- **Responsive** : smartphone, tablette et desktop
- **Déploiement** : GitHub Pages
- **Backend** : Supabase Auth + PostgreSQL + Row Level Security
- **Branche gelée** : `release/pgw-2026-rc1`

Le nettoyage contrôlé du dépôt a repassé le **V8.17 Release Gate complet avec succès**. Le snapshot applicatif RC1 de référence est le commit `2493de432cbafe2ef3f21bd42f49beb269467b6c`.

## Accès

- Application élève : https://darksathili-jpg.github.io/paris_games_week/
- Application V8 directe : https://darksathili-jpg.github.io/paris_games_week/preview-v8.html
- Cockpit enseignant : https://darksathili-jpg.github.io/paris_games_week/teacher.html

## Fonctionnement élève

L'application est conçue pour rester exploitable dans les conditions réelles d'un salon où le réseau peut être instable.

- déverrouillage séquentiel des six missions ;
- XP, badges et rang de progression ;
- autosauvegarde avant validation ;
- sauvegarde locale de secours ;
- fonctionnement local après chargement de la page ;
- file de synchronisation persistante et idempotente ;
- reprise automatique après coupure réseau ;
- session Supabase anonyme durable après fermeture/réouverture du navigateur ;
- renouvellement contrôlé du token d'accès ;
- indicateur de synchronisation et contrôle de fin de visite.

## Fonctionnement enseignant

Le cockpit enseignant permet de suivre les remontées autorisées par les politiques RLS :

- authentification enseignant ;
- lecture des progressions et réponses ;
- contrôle de fraîcheur des synchronisations ;
- fermeture des nouvelles inscriptions sans interrompre la synchronisation des élèves déjà reliés ;
- export CSV final.

## Architecture du dépôt

```text
.
├── index.html                      # point d'entrée GitHub Pages
├── preview-v8.html                 # application élève
├── teacher.html                    # cockpit enseignant
├── config.js                       # configuration publique du cockpit
├── config.example.js               # exemple de configuration
├── assets/
│   ├── watteau-logo.svg
│   └── v8/
│       ├── masters/                 # 6 illustrations sources PNG validées
│       └── mission-status.json      # état du pipeline graphique
├── css/                             # styles V8 élève + enseignant
├── js/
│   ├── content.js                   # contenu pédagogique
│   ├── v8-app.js                    # UI + progression
│   ├── v8-session.js                # persistance/refresh Auth
│   ├── v8-sync.js                   # queue local-first
│   ├── v8-supabase.js               # écritures Supabase
│   ├── v8-join.js                   # liaison à la sortie
│   ├── teacher.js                   # cockpit enseignant
│   └── supabase-client.js           # client enseignant
├── supabase/
│   ├── schema.sql
│   └── promote_teacher.sql
├── tests/visual/                    # tests Playwright terrain/release
├── tools/                           # pipeline images + contrôles CI
└── .github/workflows/               # Quality Gate + GitHub Pages
```

Les anciens placeholders graphiques SVG devenus inutiles ont été supprimés lors du nettoyage contrôlé. Les dérivés AVIF/WebP sont reconstruits automatiquement à partir des six masters PNG lors du pipeline de déploiement.

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

## Tests et Release Gate

Le projet utilise Playwright, Axe et Lighthouse pour empêcher les régressions avant publication.

```bash
npm run images:validate
npm run images:build
npm run test:visual
```

Le workflow `V8 Quality Gate` vérifie notamment :

- intégrité des masters et génération AVIF/WebP ;
- parcours complet M01 → M06 ;
- verrouillage séquentiel ;
- autosauvegarde, restauration et backup ;
- offline/reconnexion et queue idempotente ;
- session Auth durable et refresh token ;
- répétition multi-appareils ;
- cockpit enseignant ;
- 0 erreur JavaScript non gérée ;
- 0 ressource locale 4xx/5xx ;
- accessibilité automatisée et navigation clavier ;
- smartphone 360 px ;
- absence de secrets privilégiés dans le frontend ;
- budget Lighthouse mobile.

Les critères détaillés sont définis dans [`RELEASE_GATE_V8.md`](RELEASE_GATE_V8.md).

## Sécurité Supabase

L'URL du projet et la **clé publishable** peuvent être présentes dans le frontend : elles sont destinées à être publiques. La sécurité repose sur **Supabase Auth** et les politiques **Row Level Security (RLS)**.

Ne jamais placer dans le dépôt ni dans le navigateur :

- une clé `service_role` ;
- une clé `sb_secret_...` ;
- le mot de passe PostgreSQL ;
- tout secret donnant des privilèges administrateur.

La configuration terrain utilise **60 connexions anonymes par heure** afin de conserver une marge lorsque plusieurs élèves partagent la même adresse IP publique.

## Pipeline graphique

Les six illustrations finales sont gelées dans `assets/v8/masters/` au format PNG. Le pipeline produit automatiquement les formats WebP et AVIF en plusieurs largeurs sans upscale.

Documents techniques utiles :

- [`ART_DIRECTION_V8.md`](ART_DIRECTION_V8.md) — direction artistique ;
- [`IMAGE_PIPELINE_V8.md`](IMAGE_PIPELINE_V8.md) — chaîne de production des images ;
- [`V8_PRODUCTION_CONTRACT.md`](V8_PRODUCTION_CONTRACT.md) — règles de non-régression ;
- [`FIELD_READINESS_V8.md`](FIELD_READINESS_V8.md) — état final des gates ;
- [`PGW_REHEARSAL_V8.md`](PGW_REHEARSAL_V8.md) — répétition opérationnelle ;
- [`RELEASE_GATE_V8.md`](RELEASE_GATE_V8.md) — critères de release ;
- [`RELEASE_CANDIDATE_V8.md`](RELEASE_CANDIDATE_V8.md) — snapshot RC1 et politique de gel.

## Politique de finalisation

La stratégie de fin de projet est achevée :

**V8.16 validée → V8.17 Release Gate renforcé → correction des seuls défauts mesurés → Release Candidate PGW RC1 → gel.**

Le pilote avec de vrais élèves a été volontairement supprimé du processus. Le risque résiduel accepté concerne la charge réelle de saisie des 61 questions ; il reste documenté et ne doit pas conduire à modifier le contenu sur simple intuition.

Après le `GO RC`, aucune nouvelle fonctionnalité ou retouche esthétique n'est ajoutée. Seules des corrections bloquantes, reproductibles et nécessaires au terrain peuvent justifier une RC2 ou ultérieure, après passage intégral du Release Gate.

## Contexte pédagogique

Projet conçu pour les élèves de Terminale NSI du **lycée Watteau de Valenciennes** afin de transformer la Paris Games Week en activité d'observation, d'investigation et de mise en relation avec l'informatique, les formations et les métiers du numérique.
