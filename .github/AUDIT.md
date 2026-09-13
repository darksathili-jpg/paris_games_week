# Audit qualité — PGW NSI Quest 2026

## Périmètre contrôlé

- rendu desktop et smartphone ;
- lisibilité mode sombre et mode clair ;
- fonctionnement sans configuration Supabase ;
- persistance locale IndexedDB ;
- navigation par hash et rechargement de page ;
- PWA/service worker ;
- séparation authentification élève / enseignant ;
- RLS fourni dans le schéma SQL ;
- absence de secret privilégié dans le frontend ;
- export CSV UTF-8 ;
- réutilisation multi-session.

## Choix techniques de robustesse

1. Le questionnaire est utilisable même si Supabase n'est pas encore configuré.
2. Chaque réponse est écrite localement avant toute tentative réseau.
3. La file de synchronisation est conservée dans IndexedDB.
4. Le compte enseignant et le compte élève utilisent deux clés de stockage Auth distinctes dans le navigateur.
5. Les élèves n'ont pas de policy leur permettant de lister les sessions de visite.
6. L'entrée dans une session passe par une fonction PostgreSQL `SECURITY DEFINER` qui valide le code.
7. Les policies RLS empêchent la lecture inter-élèves.
8. Le cockpit n'embarque aucune service-role key.

## Points à valider avant usage réel

- activer Anonymous Sign-Ins dans Supabase ;
- exécuter `schema.sql` sans erreur ;
- promouvoir au moins un compte enseignant ;
- tester le site sur le domaine GitHub Pages final ;
- réaliser un essai avec au moins deux téléphones et un compte enseignant ;
- vérifier la politique de conservation des données avec l'établissement/DPO ;
- conserver un QR code vers l'URL GitHub Pages et le code de session hors connexion.

## Limites assumées de la V1

- aucune photo/vidéo n'est collectée afin d'éviter d'alourdir la donnée et les enjeux de droit à l'image ;
- pas de classement d'élèves ;
- le contenu pédagogique est versionné dans `js/content.js`, pas éditable depuis le cockpit ;
- le mode hors-ligne garantit la saisie locale, mais la première ouverture de l'application doit être effectuée avec une connexion pour que le cache PWA soit installé.
