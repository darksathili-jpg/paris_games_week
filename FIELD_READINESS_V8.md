# V8 — FIELD READINESS GATE

> Source de vérité après ART/RESPONSIVE gates. Objectif : rendre l'application fiable dans les conditions réelles de la Paris Games Week.

## État au 16 septembre 2026
- 6/6 masters : QA_PASSED.
- 6/6 missions : dérivés AVIF/WebP 480/720/1200 reconstruits par CI.
- Audit terrain automatisé : validé sur mobile, tablette et desktop.
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

## TEACHER GATE — V8.9 — VALIDÉ
- Accès enseignant : Supabase Auth + profil role=teacher ; aucune service_role dans le navigateur.
- RLS : lecture des profiles/responses/progress réservée à soi-même ou is_teacher(); gestion des sessions réservée à is_teacher().
- Progression cockpit : source de vérité = table progress (completed/xp).
- Synchronisation cockpit : affiche la dernière remontée connue côté serveur.
- Export CSV : pseudo, classe, missions terminées, progression, XP, dernière remontée et réponses pédagogiques.

## TEACHER UX/ART GATE — V8.10 — VALIDÉ
- Cockpit aligné sur l'identité V8.
- Ancien sélecteur Cyber / Arcade / eSport retiré.
- Pipeline élève et six masters mission gelés.

## FIELD OPERATION GATE — V8.11 — VALIDÉ
- Appareil élève : reçu local persistant de dernière synchronisation réussie.
- Départ élève : message vert uniquement si visite reliée, queue vide et synchronisation distante confirmée.
- Hors ligne / queue non vide : message explicite d'attente.
- Test coupure réseau → reconnexion → vidage queue validé.

## END-OF-VISIT GATE — V8.12 — VALIDÉ
- Fermeture de session = fermeture des nouveaux JOIN uniquement.
- Un élève déjà relié peut terminer sa synchronisation.
- Cockpit enseignant : contrôle de fin de visite + export CSV final.
- Session QA fermée : nouveau JOIN refusé, synchronisation existante maintenue.

## PGW REHEARSAL GATE — V8.13/V8.15 — VALIDÉ
- Répétition : 1 cockpit enseignant + 6 identités/appareils isolés.
- Incidents : reload, offline/reconnexion, fermeture/réouverture contexte, verrouillage, fermeture des inscriptions et dernier sync.
- Répétition exécutée une seule fois pour ne pas consommer artificiellement le quota Auth.
- Résultat : PASS.

## SYNC RECOVERY — V8.14/V8.15 — VALIDÉ
- Queue locale idempotente.
- Retry borné avec backoff pour erreurs réseau/transitoires.
- Les erreurs permanentes auth/RLS ne sont pas bouclées aveuglément.
- Un item n'est retiré de la queue qu'après réponse serveur HTTP réussie.

## AUTH CAPACITY — V8.15 — VALIDÉ
- Anonymous sign-ins limités par IP : capacité terrain configurée à **60/h**.
- JOIN instrumenté pour erreurs réseau, statut HTTP et 429.
- Quality Gate V8.15 et Pages : PASS.

## SESSION DURABILITY — V8.16 — VALIDÉ
- Session Auth élève persistée dans `localStorage` sous structure versionnée.
- Refresh proactif avant expiration et refresh après 401.
- Rotation du refresh token persistée immédiatement.
- Web Locks utilisé si disponible pour éviter les refresh concurrents.
- Échec transitoire de refresh : contexte et queue conservés.
- Un JOIN réutilise l'identité existante au lieu de recréer un compte anonyme.
- Test dédié fermeture/réouverture + refresh + panne 503 + reprise : PASS.

## RELEASE GATE RENFORCÉ — V8.17 — VALIDÉ
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
