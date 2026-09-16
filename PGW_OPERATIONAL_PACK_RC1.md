# PGW Operational Pack — V8.17 RC1

**Paris Games Week · 23 octobre 2026 · Terminale NSI · Lycée Watteau**  
**Snapshot applicatif gelé :** `2493de432cbafe2ef3f21bd42f49beb269467b6c`

> Cette fiche est une procédure terrain. Elle ne modifie pas la RC1.

## Accès

**Élèves** — https://darksathili-jpg.github.io/paris_games_week/  
**Cockpit enseignant** — https://darksathili-jpg.github.io/paris_games_week/teacher.html  
**Accès direct V8** — https://darksathili-jpg.github.io/paris_games_week/preview-v8.html  
**Code session prévu** — `PGW26`

![QR code élève](assets/pgw-qr-eleve.svg)

## 1 — Démarrage · 2 minutes

- Supabase : vérifier **Anonymous Sign-Ins activé** et **Rate Limits → Anonymous sign-ins = 60/h**.
- Ouvrir le **cockpit enseignant** et se connecter avec le compte ayant le rôle `teacher`.
- Sélectionner **PGW NSI 2026** et vérifier : **Inscriptions ouvertes** + code **PGW26**.
- Faire scanner le QR aux élèves puis : **Relier cette visite → code + pseudo + classe**.
- Vérifier que les premiers élèves apparaissent dans le cockpit.
- Quand tout le groupe est relié : **Fermer les inscriptions**. Les élèves déjà reliés continuent à synchroniser normalement.

## 2 — Réseau mauvais

- **Ne pas arrêter l’activité** : les réponses sont enregistrées localement sur l’appareil.
- Ne pas effacer les données du navigateur, ne pas changer de navigateur et éviter le mode privé.
- Garder/réouvrir la même page ; dès que le réseau revient, laisser la synchronisation reprendre.
- Si une erreur **429 / trop de connexions** apparaît : attendre puis réessayer ; ne pas recréer inutilement des sessions anonymes.
- Avant tout départ, attendre le message vert : **« ✓ Données envoyées · tu peux quitter »**.

## 3 — Un élève change de téléphone

**À éviter en cours de visite.** La progression locale ne se transfère pas automatiquement entre appareils.

1. Si l’ancien téléphone fonctionne encore : attendre **« ✓ Données envoyées · tu peux quitter »**.
2. Si les inscriptions sont fermées : les **réouvrir temporairement** dans le cockpit.
3. Sur le nouveau téléphone : scanner le QR, relier la visite avec `PGW26` et utiliser un pseudo identifiable, par exemple `Prénom-2`.
4. Refermer les inscriptions après la liaison.
5. Les données déjà synchronisées de l’ancien appareil restent dans le cockpit ; le nouvel appareil crée une nouvelle identité anonyme. Consolider les deux lignes lors de l’export si nécessaire.

**Si l’ancien appareil est perdu avant synchronisation, les réponses restées uniquement en local ne sont pas récupérables depuis Supabase.**

## 4 — Contrôle avant de quitter le salon

Dans le cockpit :

- cliquer **Contrôle de fin de visite** ;
- objectif : **À vérifier avant départ = 0** ;
- chaque élève doit afficher **« ✓ Données envoyées · tu peux quitter »** ;
- si un élève n’est pas à jour : connexion active + application ouverte jusqu’à synchronisation, puis **↻ Actualiser** le cockpit.

## 5 — Export final

1. **Fermer les inscriptions**.
2. **↻ Actualiser** et vérifier qu’aucun élève n’est à contrôler avant départ.
3. Cliquer **Exporter CSV**.
4. Ouvrir immédiatement le fichier `pgw-nsi-2026-2026-10-23.csv` et vérifier qu’il contient les élèves et leurs réponses.
5. Conserver **deux copies** du CSV sur deux emplacements différents.

---

### Règle terrain RC1

**On ne corrige pas le logiciel sur place sauf blocage P0/P1 reproductible.** En cas de réseau dégradé, priorité à la sauvegarde locale puis à la synchronisation avant départ.