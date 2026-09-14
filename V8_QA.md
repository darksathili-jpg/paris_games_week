# V8 QUALITY GATE

## Avant intégration d'un asset
- [ ] Source master conforme aux dimensions minimales.
- [ ] Aucun texte ou nombre dans l'image.
- [ ] Aucun faux bouton / HUD / badge.
- [ ] Aucun logo non demandé.
- [ ] Aucun artefact anatomique ou mosaïque.
- [ ] Sujet principal lisible en moins d'une seconde.
- [ ] Zone sûre compatible desktop/mobile.
- [ ] Contraste suffisant avec l'overlay HTML.

## Avant déploiement preview
- [ ] 6 missions exactement.
- [ ] 6 IDs uniques.
- [ ] Total XP = 1350.
- [ ] Un seul numéro HTML par carte.
- [ ] Un seul XP HTML par carte.
- [ ] Aucun scroll horizontal.
- [ ] Navigation clavier visible.
- [ ] Cibles tactiles >= 44 px visées.
- [ ] prefers-reduced-motion respecté.
- [ ] Hero non lazy-loadé lorsqu'il recevra son image finale.
- [ ] Cartes sous la ligne de flottaison lazy-loadées.
- [ ] Aucun secret Supabase côté client.
- [ ] index.html non modifié avant validation finale.

## Validation terrain
À effectuer sur :
- smartphone Android récent ;
- iPhone / Safari si disponible ;
- desktop Chrome/Edge ;
- vidéoprojecteur ou écran de classe.

## Règle de blocage
Une seule anomalie critique (image corrompue, texte doublé, ressource 404, débordement mobile, secret exposé) bloque la promotion de la preview vers index.html.
