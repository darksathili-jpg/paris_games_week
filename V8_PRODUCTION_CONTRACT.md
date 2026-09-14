# V8 — CONTRAT GLOBAL DE PRODUCTION

> Source de vérité opérationnelle. À lire avant toute action V8. Ce fichier remplace les décisions improvisées du fil de discussion.

## 1. Objectif
Livrer une application PGW NSI 2026 utilisable sur smartphone et desktop avant l'événement, sans sacrifier la cohérence graphique ni bloquer le projet sur des défauts non visibles dans le rendu final.

## 2. Architecture immuable
- Le HTML/CSS porte 100 % de l'interface : numéro, titre, XP, état, bouton, progression.
- Les illustrations sont des fonds narratifs. Elles n'ont aucune fonction sémantique.
- Les masters sont des PNG raster dans `assets/v8/masters/`.
- Les SVG historiques ne sont jamais considérés comme des masters validés.
- Sharp produit AVIF + WebP 480/720/1200, sans upscale.
- GitHub Pages construit les dérivés avant déploiement.

## 3. Definition of Done d'une mission
Une mission est terminée uniquement lorsque :
1. master raster présent et approuvé ;
2. dimensions/ratio valides ;
3. dérivés générés sans upscale ;
4. image intégrée par `picture/srcset/sizes` ;
5. rendu réel contrôlé à 390, 760 et desktop ;
6. texte HTML lisible et contraste correct ;
7. aucun doublon UI provenant de l'image ;
8. aucun 404 ;
9. état = QA_PASSED.

## 4. ART GATE réaliste
### Bloquant
- image floue ou très dégradée ;
- sujet incompréhensible ;
- anomalie visuelle majeure ;
- numéro/XP/bouton/interface dominant déjà peint dans l'image ;
- cadrage inutilisable ;
- texte parasite suffisamment gros pour concurrencer l'UI HTML.

### Non bloquant
- petit texte décoratif d'arrière-plan non lisible au format carte ;
- détail invisible après crop/overlay ;
- différence mineure de résolution si le master reste >=1500×930 et >1200 px de large ;
- élément décoratif sans impact sur compréhension.

**La décision se prend sur le rendu final de la carte, pas en pixel-peeping du master.**

## 5. Politique de génération
- 1 génération principale par mission.
- 1 retouche ciblée seulement si un défaut BLOQUANT est corrigeable.
- Une seconde génération complète uniquement si composition/cadrage/sujet sont inutilisables.
- Pas de boucle de génération pour éliminer des détails non visibles dans la carte.
- Prompts courts : sujet/action + lieu/ambiance + cadrage + contraintes réellement importantes.
- Une fois le master approuvé, l'utilisateur le transfère dans GitHub comme pour Missions 01 et 02.

## 6. Ordre de production
M01 pilote -> M02 -> M03 -> M04 -> M05 -> M06 -> audit global des cartes -> hero -> logique interactive -> QA finale.

Une mission n'empêche pas de préparer la suivante, mais elle ne peut être déclarée terminée sans QA.

## 7. Validation automatisée
La CI doit :
- lire `mission-status.json` ;
- valider uniquement les masters raster déclarés MASTER_APPROVED ou au-delà ;
- refuser un état approuvé sans PNG ;
- générer les dérivés ;
- vérifier la syntaxe ;
- à terme exécuter les captures Playwright et Lighthouse CI.

## 8. Non-régression visuelle
Playwright doit devenir l'arbitre du rendu :
- viewport mobile 390×844 ;
- tablette 760×900 ;
- desktop 1440×1000 ;
- captures de la grille des missions ;
- baseline conservée dans Git ;
- comparaison dans le même environnement CI.

## 9. Performance
- AVIF/WebP responsifs ;
- lazy-loading des cartes hors écran ;
- dimensions intrinsèques pour limiter CLS ;
- aucune image servie plus grande que nécessaire ;
- Lighthouse CI avant release candidate.

## 10. Règle de conduite
Ne jamais annoncer « en cours » après avoir rendu la main.
À chaque feu vert : exécuter le lot maximal possible avant de répondre.
Ne demander une action utilisateur que lorsqu'elle est réellement indispensable (notamment transfert du master validé vers GitHub).
