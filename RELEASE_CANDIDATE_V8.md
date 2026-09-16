# PGW NSI Quest 2026 — Release Candidate RC1

## Snapshot gelé
- Release Candidate : **RC1**
- Branche gelée : `release/pgw-2026-rc1`
- Commit applicatif de référence : `2493de432cbafe2ef3f21bd42f49beb269467b6c`
- Version applicative : **V8.17 — Release Gate renforcé**
- Cible : Paris Games Week 2026 — 23 octobre 2026

## Verdict
**GO RC**.

Le Release Gate renforcé est entièrement vert sur le snapshot applicatif nettoyé :
- Quality Gate historique : PASS
- Session Durability V8.16 : PASS
- Répétition PGW six appareils : PASS
- Release Playwright renforcé : PASS
- Lighthouse mobile release budget : PASS
- Déploiement GitHub Pages : PASS
- Nettoyage contrôlé du dépôt : PASS
- README professionnel et documentation de gel : publiés

Les commits postérieurs au snapshot applicatif de référence ne modifient que la documentation de finalisation.

## Contrat de gel
À partir de RC1 :
- aucune nouvelle fonctionnalité ;
- aucune retouche des six masters mission sans défaut bloquant reproduit ;
- aucune modification de progression, XP, badges ou contenu pédagogique sans anomalie mesurée ;
- aucune baisse de seuil ni suppression de test pour faire passer la CI ;
- seules les corrections P0/P1 reproductibles et nécessaires au terrain PGW sont autorisées ;
- toute correction applicative après RC1 doit repasser l'intégralité du V8 Quality Gate avant d'être considérée comme nouvelle RC.

## Risque résiduel explicitement accepté
Le pilote avec de vrais élèves a été volontairement annulé. La charge réelle de saisie des 61 questions n'a donc pas été mesurée sur un groupe d'élèves avant la sortie. Ce risque est accepté ; en contrepartie, le contenu pédagogique reste gelé et ne sera pas allégé sur simple intuition.

## Capacités validées avant gel
- 6 missions et 6 illustrations optimisées AVIF/WebP ;
- parcours M01 → M06 et verrouillage séquentiel ;
- autosauvegarde locale + backup ;
- fonctionnement hors ligne et reprise réseau ;
- synchronisation Supabase idempotente avec retry/backoff ;
- session Auth anonyme durable avec refresh et même identité après réouverture ;
- queue conservée en cas d'échec réseau/Auth ;
- cockpit enseignant, contrôle de fin de visite et export CSV ;
- fermeture des nouvelles inscriptions sans empêcher les dernières synchronisations ;
- contrôle responsive mobile/tablette/desktop, dont smartphone 360 px au Release Gate ;
- accessibilité automatisée, clavier, absence d'erreurs JS/ressources locales en échec ;
- budget Lighthouse mobile et vérification d'absence de clé privilégiée côté client.

## Configuration terrain à conserver
- Supabase `Anonymous sign-ins` : **60/h**.
- Ne jamais exposer `service_role`, `sb_secret_...` ou tout secret privilégié dans le frontend.
- Le réseau ne doit jamais conditionner la validation locale d'une mission.
- Avant le départ d'un élève, exiger l'état vert indiquant que les données ont été envoyées.

## Politique de promotion
RC1 est la version PGW gelée. Toute correction applicative ultérieure doit être motivée par un défaut bloquant reproduit et crée une RC2, RC3, etc., depuis un commit dont le Release Gate complet est vert.
