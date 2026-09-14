# ART DIRECTION V8 — PGW NSI QUEST 2026

## 1. Objectif
Construire une interface de mission inspirée des jeux vidéo, spectaculaire mais lisible, destinée à des élèves de Terminale NSI lors de la Paris Games Week 2026.

L'illustration raconte. Le HTML informe. Le CSS hiérarchise. Le JavaScript orchestre.

## 2. Principes non négociables
1. Une illustration ne contient jamais de texte, numéro, XP, badge, bouton, cadre UI ou faux composant.
2. Une information pédagogique n'existe qu'une seule fois dans le DOM.
3. Une mission reste utilisable si son image ne charge pas.
4. La couleur sert l'identité, jamais seule la compréhension.
5. Chaque visuel doit être lisible en moins d'une seconde.
6. Toute image défectueuse est rejetée avant intégration.

## 3. Langage visuel
- Univers : convention gaming premium, cyber-neon, anime réaliste/stylisé.
- Palette générale : bleu nuit, cyan, violet, magenta.
- Accents de mission : cyan, vert, orange, violet, rose, jaune.
- Lumière : volumétrique douce, reflets de salon, sources néon maîtrisées.
- Niveau de détail : élevé dans la scène, réduit sous les zones de texte.
- Profondeur : premier plan / sujet / arrière-plan clairement séparés.
- Interface : géométrie sobre, lignes fines, lueurs discrètes, pas de surcharge HUD.

## 4. Composition
### Hero
- Sujet principal décalé sur un tiers.
- Espace négatif réservé au vrai HTML.
- Horizon et lignes de fuite dirigés vers le contenu.
- Aucun écran ou panneau du décor ne doit contenir de texte lisible.

### Cartes mission
- Sujet principal entre 35 % et 65 % de la largeur.
- Zone basse disponible pour l'overlay HTML.
- Aucun visage ni objet clé à moins de 8 % du bord.
- Cadrage compatible desktop et mobile.

## 5. Zones sûres
Pour chaque master :
- 60 % centraux = zone narrative prioritaire.
- 20 % latéraux = zones recadrables.
- 12 % inférieurs = zone tolérant l'overlay.
- 10 % supérieurs = marge de sécurité UI.

## 6. Scènes des six missions
### 01 — Launch Zone
Entrée du salon, foule, grande perspective, sentiment de départ et d'exploration.

### 02 — Campus Scan
Échange avec un stand école/formation, écrans et brochures non lisibles, ambiance orientation.

### 03 — Code Scanner
Développeur ou élève devant gameplay et code abstrait non lisible, écrans techniques.

### 04 — Innovation Lab
VR, robotique, IA, prototype interactif. Lumière violette/bleue, impression de laboratoire.

### 05 — Pro Link
Deux personnes en conversation professionnelle, stand calme, attitude d'échange et de mentorat.

### 06 — Boss Final
Grande scène e-sport ou événement final, forte profondeur, lumière jaune/orange, sentiment d'aboutissement.

## 7. Interdits
- Texte généré dans l'image.
- Numéros 01–06 dans les pixels.
- Faux logos.
- Fausses interfaces.
- Éléments coupés au bord.
- Artefacts anatomiques évidents.
- Mosaïque, banding, surcompression.
- Image réutilisée pour plusieurs missions.
- Upscale d'une source trop petite.
- Filtre excessif pour masquer une mauvaise source.

## 8. Validation visuelle
Un asset est validé uniquement si :
- sujet compréhensible immédiatement ;
- aucune UI incorporée ;
- aucune duplication potentielle avec le HTML ;
- cohérence artistique avec les autres missions ;
- cadrage correct en desktop et mobile ;
- détails suffisamment nets à 2× la taille CSS cible ;
- contraste compatible avec un overlay de texte ;
- absence d'artefacts évidents.

## 9. Règle de production
On valide d'abord Mission 01. Le pipeline n'est dupliqué vers 02–06 qu'après validation complète du pilote.
