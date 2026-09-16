# V8 — FIELD READINESS GATE

> Source de vérité de finalisation pour PGW NSI Quest 2026.

## État final au 16 septembre 2026
- 6/6 masters : QA_PASSED.
- 6/6 missions : dérivés AVIF/WebP reconstruits par CI.
- Parcours M01 → M06 : validé.
- Persistance locale + backup : validés.
- Verrouillage séquentiel : validé.
- Contenu : 6 missions, 61 questions, 6 badges, 1350 XP.
- Répétition PGW six appareils : validée.
- Session Durability V8.16 : validée.
- Release Gate renforcé V8.17 : validé après nettoyage contrôlé du dépôt.
- Release Candidate : **RC1 gelée**.

## Risque résiduel accepté
Le pilote avec de vrais élèves a été volontairement annulé. La charge réelle de saisie des 61 questions n'a donc pas été mesurée sur un groupe d'élèves avant la sortie. Ce risque est accepté. Le contenu pédagogique reste gelé et ne doit pas être modifié sur simple intuition.

## Règles de non-régression
- Ne pas retoucher les six masters sans défaut bloquant constaté.
- Ne pas remplacer un test par une impression subjective.
- Toute correction doit répondre à un défaut mesuré et reproductible.
- Toute évolution doit conserver le parcours M01→M06, la persistance et le verrouillage.
- Aucun échec réseau ou Auth ne doit effacer une réponse élève.
- Aucun refresh de session ne doit créer un nouvel utilisateur anonyme.
- Aucun test ni seuil ne doit être relâché pour obtenir artificiellement un gate vert.

## Gates validés
### V8.9 — Teacher Gate
Accès enseignant, RLS, progression cockpit et export CSV validés.

### V8.10 — Teacher UX/Art Gate
Cockpit aligné sur l'identité V8 ; ancien héritage visuel retiré ; six masters gelés.

### V8.11 — Field Operation Gate
Autosauvegarde, reprise réseau et contrôle de départ élève validés.

### V8.12 — End-of-Visit Gate
Fermeture des nouveaux JOIN sans interrompre les synchronisations existantes ; export final validé.

### V8.13/V8.15 — PGW Rehearsal Gate
Répétition 1 cockpit + 6 identités/appareils isolés, avec reload, offline/reconnexion, fermeture/réouverture, verrouillage et fin de visite : PASS.

### V8.14/V8.15 — Sync Recovery
Queue idempotente, retry/backoff et conservation des opérations non acquittées : validés.

### V8.15 — Auth Capacity
Anonymous sign-ins configurés à **60/h** ; JOIN instrumenté ; Quality Gate et Pages : PASS.

### V8.16 — Session Durability
Session Auth persistante, refresh contrôlé, rotation de refresh token, Web Locks, même identité après réouverture et queue conservée en cas de panne : PASS.

### V8.17 — Release Gate renforcé
- Quality Gate historique : PASS.
- Session Durability : PASS.
- Répétition six appareils : PASS.
- Release Playwright : PASS.
- Lighthouse mobile : PASS selon les budgets définis.
- 0 erreur JavaScript non gérée dans le gate.
- 0 ressource locale 4xx/5xx dans le gate.
- Contrôles Axe serious/critical, clavier et viewport 360 px : PASS.
- Recherche de secrets privilégiés côté client : PASS.
- Nettoyage contrôlé : anciens placeholders SVG et marqueur temporaire supprimés ; fichiers nécessaires au build, aux tests, à Supabase et à Pages conservés.
- README final professionnel : publié.
- Commit applicatif de référence RC1 : `2493de432cbafe2ef3f21bd42f49beb269467b6c`.

## GEL — RC1
Le projet est désormais en gel fonctionnel. Aucune fonctionnalité supplémentaire ni retouche esthétique n'est autorisée. Seules des corrections bloquantes, mesurées et reproductibles peuvent justifier une RC2 ou ultérieure, après passage intégral du Release Gate.
