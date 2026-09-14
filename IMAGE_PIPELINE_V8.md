# IMAGE PIPELINE V8

## 1. Architecture
```
assets/v8/
  masters/
  generated/
    hero/
    mission-01/
    mission-02/
    mission-03/
    mission-04/
    mission-05/
    mission-06/
  manifest.json
```

Les masters ne sont jamais utilisés directement dans le navigateur.

## 2. Spécifications minimales
### Hero
- Master recommandé : >= 2400 px de large.
- Ratio cible desktop : 16:9.
- Variante mobile : cadrage vertical ou 4:5 dédié si nécessaire.

### Missions
- Master recommandé : >= 1600 × 1000 px.
- Ratio source : 8:5 ou proche.
- Aucun agrandissement autorisé.

## 3. Sorties prévues
Pour une mission :
- 480 px WebP
- 720 px WebP
- 1200 px WebP
- 480 px AVIF
- 720 px AVIF
- 1200 px AVIF

Hero :
- 960 px WebP/AVIF
- 1600 px WebP/AVIF
- 2400 px WebP/AVIF

## 4. Politique de qualité
- AVIF : qualité visuelle élevée, jamais choisie uniquement pour minimiser le poids.
- WebP : fallback moderne.
- JPEG : uniquement si nécessaire.
- On compare toujours le rendu avant de retenir les paramètres.

## 5. Validation automatique
Le build échoue si :
- master absent ;
- largeur/hauteur sous le minimum ;
- ratio hors tolérance ;
- fichier vide ;
- sortie plus grande que la source ;
- nom non conforme ;
- doublon d'ID ;
- manifest incohérent.

## 6. Validation manuelle obligatoire
Le script ne peut pas détecter :
- texte parasite dans l'image ;
- faux bouton ;
- nombre généré ;
- incohérence de scène ;
- visage ou main anormale ;
- artefact visuel subtil.

Ces points doivent être validés avant intégration.

## 7. Intégration HTML
Les illustrations significatives utilisent `<picture>` et `<img>`, pas un `background-image` principal.

Exemple :
```html
<picture>
  <source type="image/avif"
    srcset="assets/v8/generated/mission-01/mission-01-480.avif 480w,
            assets/v8/generated/mission-01/mission-01-720.avif 720w,
            assets/v8/generated/mission-01/mission-01-1200.avif 1200w">
  <source type="image/webp"
    srcset="assets/v8/generated/mission-01/mission-01-480.webp 480w,
            assets/v8/generated/mission-01/mission-01-720.webp 720w,
            assets/v8/generated/mission-01/mission-01-1200.webp 1200w">
  <img src="assets/v8/generated/mission-01/mission-01-720.webp"
       width="1200" height="750"
       loading="lazy" decoding="async" alt="">
</picture>
```

## 8. Hero
Le hero est potentiellement LCP :
- `loading="eager"`
- `fetchpriority="high"`
- dimensions explicites
- pas de lazy loading

## 9. CI
Le pipeline doit être reproductible par :
```bash
npm ci
npm run images:validate
npm run images:build
```

Aucune image n'est branchée à la preview tant que ces étapes n'ont pas réussi.
