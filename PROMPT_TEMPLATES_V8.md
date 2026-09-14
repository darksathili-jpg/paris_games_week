# PROMPT TEMPLATES V8 — Production v2

## Doctrine
Le générateur produit uniquement **la photographie/illustration de fond**. Il ne connaît ni le numéro de mission, ni XP, ni READY/LOCKED, ni la carte HTML.

Un prompt de production contient 4 blocs mentaux, dans cet ordre :
1. **sujet + action** ;
2. **lieu + lumière + palette** ;
3. **composition spatiale** ;
4. **contraintes négatives courtes et concrètes**.

Cette structure suit les recommandations OpenAI : prompts clairs, descriptifs, 1–3 phrases, contraintes explicites, puis corrections ciblées plutôt qu'une accumulation d'instructions.

## Interdictions structurelles
Pour éviter le texte parasite, on ne se contente plus d'écrire « sans texte » : on **retire de la scène les objets qui invitent le modèle à écrire**.

Interdits dans les masters :
- affiches et panneaux publicitaires ;
- signalétique ;
- brochures, livres et magazines visibles ;
- badges nominatifs ;
- écrans frontaux lisibles ;
- murs de logos ;
- enseignes ;
- interfaces de dashboard ;
- cartes/encarts graphiques.

Autorisés :
- écrans vus en biais ou montrant uniquement lumière, formes, graphiques abstraits ou gameplay sans HUD ;
- architecture de stand ;
- éclairages ;
- objets technologiques ;
- personnes ;
- mobilier ;
- végétation ;
- silhouettes et foule floutée.

## Safe zones
Les sujets principaux occupent de préférence le centre et le tiers supérieur/médian.
Le tiers inférieur doit rester suffisamment calme pour le voile et le contenu HTML.
Aucune information essentielle ne doit dépendre d'un bord de l'image.

## Mission 02 — Campus Scan
Scène cinématographique autonome dans un salon numérique premium : un élève de Terminale avec sac à dos échange naturellement avec une professionnelle de l'orientation devant un comptoir minimaliste ; elle lui montre du doigt deux objets technologiques neutres représentant deux parcours à comparer. Architecture bleu/cyan/vert, éclairage de salon, quelques visiteurs flous en profondeur, composition respirante et tiers inférieur visuellement calme. Aucun panneau, affiche, brochure, livre, badge nominatif, logo, enseigne, texte, chiffre, interface, bouton ni écran frontal lisible.

## Mission 03 — Code Scanner
Scène cinématographique autonome dans un espace de démonstration jeu vidéo : un élève observe un développeur devant deux moniteurs vus légèrement de biais ; l'un montre uniquement des lignes lumineuses abstraites évoquant du code sans caractères lisibles, l'autre une scène de jeu sans HUD. Palette orange/cyan, profondeur de salon, tiers inférieur calme. Aucun panneau, affiche, signalétique, logo, texte, chiffre, badge, bouton ni interface lisible.

## Mission 04 — Innovation Lab
Scène cinématographique autonome dans un laboratoire de démonstration : un élève expérimente un casque VR tandis qu'un petit robot de démonstration et une visualisation holographique abstraite occupent l'arrière-plan. Palette violet/cyan, lumière volumétrique, architecture premium, tiers inférieur calme. Aucun panneau, affiche, signalétique, logo, texte, chiffre, badge, bouton ni interface lisible.

## Mission 05 — Pro Link
Scène cinématographique autonome dans un espace calme du salon : un élève échange avec une professionnelle du numérique autour d'une petite table épurée, posture de mentorat et conversation authentique, foule douce en arrière-plan. Palette rose/violet avec lumière cyan, tiers inférieur calme. Aucun document imprimé, panneau, écran frontal, badge nominatif, logo, texte, chiffre, bouton ni interface.

## Mission 06 — Boss Final
Scène cinématographique autonome devant une grande scène e-sport : un élève vu de trois-quarts au premier plan regarde la scène, foule en profondeur, projecteurs et structures lumineuses abstraites, sensation d'aboutissement. Palette jaune/orange avec accents violets, tiers inférieur calme. Aucun écran avec texte ou score, panneau, enseigne, sponsor, logo, chiffre, badge, bouton ni interface.

## Politique d'itération
- Génération 1 : composition.
- Si composition bonne mais défaut local : **éditer l'image existante**, ne pas régénérer toute la scène.
- Si le même défaut revient deux fois : supprimer l'objet causal du prompt.
- Maximum 3 générations complètes par mission avant changement de stratégie.
- Une image proche de la cible dimensionnelle n'est pas rejetée si elle dépasse 1500×930 et reste supérieure au dérivé 1200 px.
