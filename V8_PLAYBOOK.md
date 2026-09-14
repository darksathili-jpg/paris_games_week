# V8 PLAYBOOK — Méthode de production verrouillée

Ce document est la source de vérité de la V8. Il doit être relu avant toute modification visuelle ou génération d'asset.

## Principe central
Une illustration est **une scène**, jamais une interface.

Le HTML contient :
- numéro de mission ;
- XP ;
- titre ;
- description ;
- état READY/LOCKED ;
- boutons ;
- progression.

Les images ne contiennent jamais ces éléments.

## Chaîne de production obligatoire
Chaque mission suit exactement cet ordre :

```
CANDIDATE
  ↓
ART_GATE
  ↓
MASTER_APPROVED
  ↓
RESPONSIVE_BUILD
  ↓
INTEGRATED
  ↓
QA_PASSED
```

Aucune étape ne peut être sautée.

## Définition des états

### CANDIDATE
Image générée ou proposée. Elle n'est pas encore digne du dépôt.

### ART_GATE
Contrôle visuel manuel :
- aucun texte lisible ;
- aucun chiffre de mission ;
- aucun XP ;
- aucun faux bouton ;
- aucun logo parasite ;
- aucun cadre UI ;
- aucun artefact ;
- composition compatible desktop/mobile ;
- cohérence avec la bible artistique ;
- netteté suffisante.

### MASTER_APPROVED
Le master est explicitement validé. Il peut entrer dans `assets/v8/masters/`.

### RESPONSIVE_BUILD
Le pipeline Sharp génère AVIF/WebP 480/720/1200 sans upscale.

### INTEGRATED
Le HTML utilise `<picture>` + `srcset` + `sizes`. L'image ne porte aucune information sémantique indispensable.

### QA_PASSED
Contrôles visuels et techniques réussis :
- desktop ;
- mobile ;
- contraste ;
- cadrage ;
- absence de doublons ;
- aucun débordement ;
- aucun 404 ;
- service worker/cache vérifié.

## Règles de génération
Ne jamais demander au générateur :
- "une carte Mission 02" ;
- "une interface Mission 03" ;
- "un dashboard Mission 04".

Toujours demander :
- "une scène illustrative autonome" ;
- sans texte ;
- sans UI ;
- sans numéro ;
- sans badge ;
- sans logo ;
- au ratio 8:5 ;
- avec zone sûre pour overlay HTML.

## Politique de rejet
Une image imparfaite est rejetée avant GitHub.
On ne tente pas de masquer :
- texte parasite ;
- mauvaise anatomie ;
- artefact ;
- mauvaise composition ;
- faible définition ;
- cadrage irrécupérable.

## Règle d'escalade
Si deux générations consécutives échouent au même critère :
1. arrêter la génération ;
2. reformuler le prompt autour de la scène uniquement ;
3. réduire le nombre d'objets ;
4. supprimer toute référence à carte, interface, mission ou écran textuel ;
5. générer à nouveau.

## Règle de livraison
Ne jamais dire qu'une mission est "construite" si son état n'est pas `QA_PASSED`.


## Addendum 2026-09-14 — contrat de production réaliste
Le générateur d'images peut produire une dimension voisine de la cible. La qualité ne doit jamais être jugée sur une différence arbitraire de quelques pixels.

### Contrat master raster
- ratio cible : 8:5 (1.6) avec tolérance 1.55–1.65 ;
- largeur minimale acceptée : 1500 px ;
- hauteur minimale acceptée : 930 px ;
- largeur dérivée maximale : 1200 px ;
- **aucun upscale** ;
- une image conforme de 1585×992 est donc techniquement exploitable et supérieure à la dérivée maximale.

### Contrat artistique
Le contrôle artistique reste strict et indépendant des dimensions :
- scène autonome ;
- aucun texte lisible ou pseudo-texte dominant ;
- aucun numéro, XP, badge, bouton, logo ou cadre UI ;
- pas d'anomalie anatomique/structurelle évidente ;
- point focal identifiable ;
- zone basse compatible avec le voile et le contenu HTML ;
- recadrage desktop et mobile viable.

### Contrat QA
La validation finale doit combiner :
1. validation du master ;
2. build responsive ;
3. contrôle des URLs générées ;
4. captures desktop/mobile reproductibles ;
5. contrôle de régression visuelle ;
6. audit Lighthouse/performance avant promotion.
