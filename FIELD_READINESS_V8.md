# V8 — FIELD READINESS GATE

> Source de vérité après ART/RESPONSIVE gates. Objectif : rendre l'application fiable dans les conditions réelles de la Paris Games Week.

## État au 15 septembre 2026
- 6/6 masters : QA_PASSED.
- 6/6 missions : dérivés AVIF/WebP 480/720/1200.
- Audit terrain automatisé : validé sur mobile 390, tablette 760 et desktop 1440.
- Parcours M01 → M06 : validé.
- Persistance locale + backup : validés.
- Verrouillage séquentiel : validé.
- Drawer : contenu dans le viewport et contrôles visibles.
- Contenu : 6 missions, 61 questions, 6 badges, 1350 XP.
- Répétition PGW six appareils : validée en V8.15.

## Retours terrain confirmés
- Test PC réel : autosauvegarde et progression confirmées.
- UX-P1 drawer desktop : corrigé en V8.5 (panneau mieux proportionné, flou réduit, XP non promis lors d'une simple modification).

## Risques terrain encore ouverts
### P0 — perte de données
Le localStorage protège contre un rechargement sur le même appareil, et la synchronisation Supabase fournit une copie distante. L'invariant reste : aucune erreur réseau/Auth ne doit supprimer une réponse ou une opération encore non acquittée par le serveur.

### P0 — reprise après réseau dégradé
La validation d'une mission ne dépend jamais du réseau. Le réseau ne sert qu'à synchroniser une copie des réponses ; la queue locale doit survivre à une panne de refresh Auth et repartir avec la même identité.

### P0 — durabilité de session Auth
V8.15 stockait encore les tokens élève en sessionStorage. V8.16 doit garantir qu'une fermeture complète du navigateur conserve l'identité anonyme Supabase, renouvelle le token expirant et ne crée pas un nouvel utilisateur anonyme inutilement.

### P1 — charge de saisie mobile
61 questions au total. M03 (16 questions), M02 (13), M04 (12) et M06 (12) concentrent l'effort. Ne pas supprimer pédagogiquement des questions sans test élève ; mesurer d'abord temps, abandons et friction.

### P1 — enseignant
Le mode enseignant ne doit jamais utiliser de clé service_role dans le navigateur. Les droits d'accès sont imposés côté Supabase/RLS.

## Ordre strict restant
1. SESSION DURABILITY GATE — fermeture/réouverture + refresh + même identité + queue préservée.
2. STUDENT PILOT — test réel sur quelques élèves ; mesurer temps/frictions avant d'alléger les 61 questions.
3. RELEASE GATE — Lighthouse, accessibilité, offline/réseau lent, erreurs JS/404, version gelée.

## Règles de non-régression
- Ne pas retoucher les six masters sans défaut bloquant constaté.
- Ne pas remplacer un test par une impression subjective.
- Une correction doit répondre à un défaut mesuré.
- Toute évolution fonctionnelle doit conserver le parcours M01→M06, la persistance et le verrouillage.
- Aucun échec réseau ou Auth ne doit effacer une réponse élève.
- Aucun refresh de session ne doit créer un nouvel utilisateur anonyme.

## TEACHER GATE — V8.9
- Accès enseignant : Supabase Auth + profil role=teacher ; aucune service_role dans le navigateur.
- RLS : lecture des profiles/responses/progress réservée à soi-même ou is_teacher(); gestion des sessions réservée à is_teacher().
- Progression cockpit : source de vérité = table progress (completed/xp), et non inférence depuis les champs de réponse.
- Synchronisation cockpit : affiche la dernière remontée connue côté serveur. Ne prétend jamais connaître une queue hors ligne non encore remontée.
- Export CSV : pseudo, classe, missions terminées, progression, XP, dernière remontée et réponses pédagogiques.
- Limite assumée : un élève hors ligne peut avoir une queue locale invisible au serveur ; le cockpit signale donc la fraîcheur de la dernière remontée, pas un faux état « pending » distant.

## TEACHER UX/ART GATE — V8.10 — VALIDÉ TERRAIN
- Validation humaine du rendu réel : OK.
- Ancien sélecteur Cyber / Arcade / eSport retiré définitivement.
- Cockpit aligné sur l'identité V8, avec densité adaptée au rôle enseignant.
- Pipeline élève et six masters mission gelés : aucune modification nécessaire.
- Régression automatisée : shell enseignant V8 présent, héritage visuel absent, thème accessible, pas de débordement horizontal sur les viewports du gate.

## FIELD OPERATION GATE — V8.11 — VALIDÉ TERRAIN
- Aucun master mission ni direction artistique mission modifiés.
- Appareil élève : reçu local persistant de dernière synchronisation réussie.
- Départ élève : message vert « Données envoyées · tu peux quitter » uniquement si visite reliée, queue vide et synchronisation distante déjà confirmée.
- Hors ligne / queue non vide : message explicite « Ne ferme pas · envoi en attente ».
- Cockpit enseignant : KPI « À vérifier avant départ » basé sur absence de remontée ou dernière remontée > 5 minutes.
- Limite volontaire : le serveur ne peut pas connaître une queue locale hors ligne ; le contrôle de départ est donc double : fraîcheur serveur + confirmation verte sur l'appareil élève.
- Test de non-régression ajouté : coupure réseau pendant M01, état départ bloqué, reconnexion, vidage queue, état départ autorisé.
- Validation humaine terrain : OK. Gate gelé ; toute régression de ce contrat doit faire échouer la CI.

## END-OF-VISIT GATE — V8.12 — VALIDÉ
- Fermeture de session = fermeture des nouveaux JOIN uniquement.
- Un profil student déjà relié reste associé à sa visit_session même lorsque is_active=false.
- Les RLS de responses/progress restent basées sur auth.uid() + visit_session_id du profil : une fermeture ne coupe donc pas le vidage d'une queue existante.
- Cockpit enseignant : confirmation explicite avant fermeture, libellé « Inscriptions fermées · synchronisation maintenue », panneau « Contrôle de fin de visite ».
- Procédure : fermer inscriptions → actualiser → traiter « À vérifier » → exiger le message vert sur les appareils concernés → actualiser → exporter CSV final.
- Export final : pseudo, classe, missions terminées, progression, XP, dernière remontée et réponses.
- Test CI V8.12 ajouté et obligatoire.
- Validation serveur réelle : session QA fermée `QAEND12` refuse un nouveau JOIN ; la synchronisation d'un élève déjà relié reste indépendante de `is_active`.
- Validation terrain : OK. Gate gelé ; toute régression de ce contrat doit faire échouer la CI.

## PGW REHEARSAL GATE — V8.13/V8.15 — VALIDÉ
- Runbook opérationnel : `PGW_REHEARSAL_V8.md`.
- Répétition : 1 cockpit enseignant + 6 identités/appareils isolés.
- Incidents imposés : reload, offline/reconnexion, fermeture/réouverture contexte, tentative de contournement du verrouillage, fermeture des inscriptions et dernier sync.
- V8.15 : répétition exécutée une seule fois afin de ne pas fausser le test par consommation artificielle du quota Auth.
- Résultat : répétition six appareils 1/1 PASS, en plus des 48 tests terrain responsive PASS.
- Les six masters mission et leur direction artistique restent gelés.

## SYNC RECOVERY — V8.14/V8.15 — VALIDÉ
- Diagnostic initial V8.13 : une queue de 3 opérations restait après 20 s dans la répétition multi-appareils.
- Documentation Supabase vérifiée avant correction : erreurs transitoires retentées avec backoff ; écritures idempotentes ; erreurs conservées pour diagnostic.
- Notre client utilise le Data API par fetch direct : ne pas supposer que les retries du SDK supabase-js protègent ces POST.
- Correction : classification réseau/HTTP, diagnostics persistés, retry borné 0.7/1.5/3/6 s pour erreurs réseau et statuts transitoires.
- Les erreurs permanentes (notamment auth/RLS 401/403) ne sont pas bouclées aveuglément.
- Invariant maintenu : un item n'est retiré de la queue qu'après réponse serveur HTTP réussie.
- V8.15 confirme le rattrapage réseau dans la répétition six appareils.

## AUTH CAPACITY — V8.15 — VALIDÉ
- Documentation Supabase vérifiée : les anonymous sign-ins sont limités par IP ; la valeur par défaut documentée est 30 requêtes/h par IP avec burst.
- Le test multi-appareils ne tourne plus trois fois selon les projets Playwright ; il tourne une seule fois et contient déjà un persona mobile.
- Les autres tests responsive restent exécutés sur mobile/tablette/desktop.
- JOIN instrumenté : stade d'échec, statut HTTP, code, retry-after et détail sont journalisés ; un 429 produit un message utilisateur compréhensible.
- Configuration terrain : `Anonymous sign-ins = 60/h` réglée dans Supabase le 15 septembre 2026.
- Quality Gate V8.15 : 48/48 tests responsive PASS + répétition six appareils 1/1 PASS + déploiement Pages SUCCESS.
- Ne pas augmenter arbitrairement un timeout pour masquer un 429 ou un défaut d'Auth.

## SESSION DURABILITY — V8.16 — EN VALIDATION
- Référence Supabase : une session navigateur repose sur un access token court + un refresh token durable ; les refresh tokens peuvent être rotatifs et la nouvelle valeur doit être persistée immédiatement.
- Session Auth élève déplacée vers `localStorage` sous une structure versionnée `pgw-v8-auth-session-v1` ; migration automatique des anciens tokens V8.15 présents en sessionStorage.
- Refresh proactif 5 minutes avant expiration, refresh au retour au premier plan/réseau et refresh forcé après un 401 Data API ou JOIN.
- Un refresh réussi remplace atomiquement access token + refresh token + expiration tout en conservant le même userId.
- Web Locks utilisé quand disponible afin d'éviter deux rotations concurrentes du même refresh token dans plusieurs onglets.
- Un échec transitoire de refresh ne supprime ni la session locale, ni le contexte de visite, ni la queue. Si l'access token est encore utilisable, il reste utilisable ; sinon la queue attend.
- Un JOIN réutilise une session anonyme existante au lieu de créer un nouveau compte ; un échec RPC ne détruit plus l'identité Auth.
- Test dédié prévu avec une seule identité afin d'économiser le quota : fermeture/réouverture simulée, refresh réel, compteur signup inchangé, panne 503 de refresh simulée, queue conservée puis vidée après retour du service.
- Verdict : ne passer à VALIDÉ qu'après Quality Gate V8.16 vert sans relâcher les assertions existantes.
