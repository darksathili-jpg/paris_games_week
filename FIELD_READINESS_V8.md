# V8 — FIELD READINESS GATE

> Source de vérité après ART/RESPONSIVE gates. Objectif : rendre l'application fiable dans les conditions réelles de la Paris Games Week.

## État au 15 septembre 2026
- 6/6 masters : QA_PASSED.
- 6/6 missions : dérivés AVIF/WebP 480/720/1200.
- Audit terrain automatisé : 18/18 tests Playwright réussis sur mobile 390, tablette 760 et desktop 1440.
- Parcours M01 → M06 : validé.
- Persistance localStorage après rechargement : validée.
- Verrouillage séquentiel : validé.
- Drawer : contenu dans le viewport et contrôles visibles.
- Contenu : 6 missions, 61 questions, 6 badges, 1350 XP.

## Retours terrain confirmés
- Test PC réel : autosauvegarde et progression confirmées.
- UX-P1 drawer desktop : corrigé en V8.5 (panneau mieux proportionné, flou réduit, XP non promis lors d'une simple modification).

## Risques terrain encore ouverts
### P0 — perte de données
Le localStorage protège contre un rechargement sur le même appareil, mais ne constitue pas une sauvegarde distante. La synchronisation Supabase doit être conçue en mode local-first : écriture locale immédiate, file de synchronisation, accusé de réception serveur, retry sans perte.

### P0 — reprise après réseau dégradé
La validation d'une mission ne doit jamais dépendre du réseau. Le réseau ne doit servir qu'à synchroniser une copie des réponses.

### P1 — charge de saisie mobile
61 questions au total. M03 (16 questions), M02 (13), M04 (12) et M06 (12) concentrent l'effort. Ne pas supprimer pédagogiquement des questions sans test élève ; mesurer d'abord temps, abandons et friction.

### P1 — récupération
Prévoir un indicateur explicite : Enregistré sur cet appareil / Synchronisation en attente / Synchronisé.

### P1 — enseignant
Le mode enseignant ne doit jamais utiliser de clé service_role dans le navigateur. Les droits d'accès doivent être imposés côté Supabase/RLS.

## Ordre strict restant
1. DATA SAFETY GATE — local-first + file de synchronisation + reprise.
2. SUPABASE GATE — schéma minimal, RLS, idempotence, aucune clé privilégiée côté client.
3. TEACHER GATE — lecture/filtrage/export des remontées autorisées.
4. STUDENT PILOT — test réel sur quelques élèves ; mesurer temps/frictions avant d'alléger les 61 questions.
5. RELEASE GATE — Lighthouse, accessibilité, offline/réseau lent, erreurs JS/404, version gelée.

## Règles de non-régression
- Ne pas retoucher les six masters sans défaut bloquant constaté.
- Ne pas remplacer un test par une impression subjective.
- Une correction doit répondre à un défaut mesuré.
- Toute évolution fonctionnelle doit conserver le parcours M01→M06, la persistance et le verrouillage.
- Aucun échec réseau ne doit effacer une réponse élève.


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
