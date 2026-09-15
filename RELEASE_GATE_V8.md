# V8.17 — RELEASE GATE RENFORCÉ

Objectif : transformer la V8.16 techniquement validée en Release Candidate PGW sans ajouter de fonctionnalités non nécessaires.

## Principe
Le pilote élèves est volontairement abandonné. Le risque résiduel accepté est donc l'absence de mesure réelle de fatigue/friction sur les 61 questions. En conséquence, le contenu pédagogique reste gelé : aucune suppression ou réécriture massive sans défaut mesuré.

## Critères bloquants
- Quality Gate historique intégralement vert.
- Session durability V8.16 toujours verte.
- Répétition PGW six appareils toujours verte.
- 0 erreur JavaScript non gérée sur l'application élève et le cockpit public.
- 0 ressource locale 4xx/5xx au chargement.
- 0 violation Axe `serious` ou `critical` sur la page élève et le drawer de mission.
- Navigation clavier : skip-link et ouverture/fermeture mission utilisables.
- Smartphone 360 px : aucun débordement horizontal, drawer contenu dans le viewport, cibles tactiles >= 24 px.
- Réseau 3G simulé : shell + Mission 01 utilisables en moins de 20 s.
- Budget de transfert initial <= 3,5 Mo.
- Aucune chaîne `service_role` ou `sb_secret_` dans les sources client V8.
- Lighthouse mobile : Performance >= 75, Accessibility >= 95, Best Practices >= 90.

## Règles de correction
- Corriger uniquement un défaut reproduit par un test ou un audit mesuré.
- Ne pas retoucher les six masters mission sans défaut bloquant.
- Ne pas modifier la logique de progression pour améliorer artificiellement un score de performance.
- Ne jamais relâcher un test existant pour faire passer la CI.
- Après correction : relancer le Release Gate complet.

## Verdict
- `GO RC` uniquement si tous les critères bloquants sont verts.
- Sinon : correction minimale → nouveau gate.
- Après `GO RC` : version Release Candidate, gel fonctionnel, seules corrections bloquantes autorisées.
