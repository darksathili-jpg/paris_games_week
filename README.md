# PGW NSI Quest 2026

Application web/PWA de terrain pour une classe de **Terminale NSI** à la **Paris Games Week 2026**, vendredi **23 octobre 2026**. Elle transforme le questionnaire de visite en six missions : préparation, orientation, analyse NSI, innovation/IA, rencontre professionnelle et bilan final.

## Ce que contient la V1

- interface élève responsive, pensée pour smartphone ;
- 6 missions, 1 350 XP et badges de progression **sans classement entre élèves** ;
- questionnaire conforme au support pédagogique PGW NSI 2026 ;
- sauvegarde locale immédiate dans **IndexedDB** ;
- synchronisation Supabase différée quand le réseau revient ;
- authentification élève **anonyme** : aucune adresse e-mail demandée ;
- code de session configurable ;
- Row Level Security : un élève ne peut consulter que ses propres réponses ;
- cockpit enseignant protégé par un compte Supabase ;
- progression de classe, réponses individuelles, fermeture/réouverture d'une session ;
- création de nouvelles sessions pour réutiliser l'application les années suivantes ;
- export CSV compatible tableur ;
- mode clair/sombre et prise en compte de `prefers-reduced-motion` ;
- PWA/service worker pour garder l'interface disponible avec un réseau dégradé.

> L'application fonctionne également **sans Supabase** pour les tests : les données restent alors sur le navigateur utilisé.

---

## 1. Tester immédiatement en local

Il faut servir les fichiers via HTTP (pas ouvrir `index.html` directement) afin que le service worker et les modules navigateur fonctionnent normalement.

```bash
python -m http.server 8080
```

Puis ouvrir :

```text
http://localhost:8080
```

Code de mission local par défaut : **PGW26**.

Le cockpit enseignant affiche une procédure de configuration tant que Supabase n'est pas connecté.

---

## 2. Créer le projet Supabase

1. Créer un projet sur Supabase.
2. Ouvrir **SQL Editor**.
3. Copier/coller et exécuter entièrement :
   - `supabase/schema.sql`
4. Dans **Authentication**, activer **Anonymous Sign-Ins**.
5. Créer manuellement votre compte enseignant avec e-mail + mot de passe dans **Authentication > Users**.
6. Exécuter `supabase/promote_teacher.sql` après avoir remplacé l'adresse e-mail du modèle.

Le schéma crée déjà la session :

- titre : `PGW NSI 2026`
- date : `2026-10-23`
- code : `PGW26`

Vous pourrez ensuite créer les sessions 2027, 2028… directement depuis le cockpit.

### Vérification de sécurité

Le navigateur ne doit contenir **ni `service_role` key ni secret key**. Seule la clé **publishable/anon** est utilisée côté frontend. Le contrôle d'accès réel est assuré par les policies RLS de `schema.sql`.

---

## 3. Relier le site à Supabase

Dans **Project Settings > API**, relever :

- Project URL ;
- Publishable key (ou `anon` key sur les anciens projets).

Modifier `config.js` :

```js
window.PGW_CONFIG = {
  appName: "PGW NSI Quest",
  edition: 2026,
  visitDate: "2026-10-23",
  venue: "Paris Expo – Porte de Versailles",
  defaultSessionCode: "PGW26",
  supabaseUrl: "https://VOTRE-PROJET.supabase.co",
  supabaseAnonKey: "VOTRE_CLE_PUBLISHABLE",
  allowLocalFallback: true,
  teacherEmailHint: "",
  officialSite: "https://www.parisgamesweek.com/fr"
};
```

La clé publishable/anon peut être présente dans un dépôt public **uniquement parce que le RLS est activé et correctement configuré**. Ne jamais y placer une clé privilégiée.

---

## 4. Déployer sur GitHub Pages

### Méthode recommandée : GitHub Actions

Le dépôt contient déjà `.github/workflows/pages.yml`.

1. Créer un dépôt GitHub.
2. Copier tous les fichiers de ce dossier à la racine du dépôt.
3. Pousser sur la branche `main`.
4. Sur GitHub : **Settings > Pages**.
5. Dans **Build and deployment > Source**, choisir **GitHub Actions**.
6. Attendre la fin du workflow **Deploy GitHub Pages**.

Votre URL sera du type :

```text
https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT/
```

Le site utilise uniquement des chemins relatifs ; il fonctionne donc correctement dans un sous-dossier GitHub Pages.

---

## 5. Déroulé le jour de la PGW

### Élève

1. Scanne le QR code du site.
2. Entre prénom/pseudonyme, classe et code `PGW26`.
3. Supabase crée une session anonyme.
4. L'élève répond au fil de la visite.
5. Chaque saisie est enregistrée d'abord sur son téléphone.
6. Si le réseau est disponible, elle est synchronisée vers Supabase.
7. En cas de coupure réseau, la saisie continue ; la synchronisation reprend au retour de la connexion.

### Enseignant

Ouvrir :

```text
/teacher.html
```

Le cockpit permet de :

- sélectionner une session ;
- voir le nombre de participants ;
- suivre la progression moyenne ;
- voir la progression par mission ;
- consulter les réponses d'un élève ;
- exporter toutes les réponses en CSV ;
- fermer les inscriptions ;
- créer une session pour l'année suivante.

---

## 6. Données et confidentialité

Données demandées dans la V1 :

- prénom ou pseudonyme ;
- classe ;
- réponses pédagogiques ;
- progression et horodatage technique.

L'application ne demande pas : date de naissance, adresse postale, numéro de téléphone ou e-mail élève.

Pour une utilisation institutionnelle, adaptez la durée de conservation et l'information des élèves aux règles de votre établissement et à votre cadre RGPD/DPO.

---

## 7. Modifier le questionnaire ou préparer 2027

Les contenus pédagogiques se trouvent dans :

```text
js/content.js
```

Une mission possède :

```js
{
  key: "nsi",
  title: "Code Scanner",
  xp: 300,
  questions: [ ... ]
}
```

Tant que les `key` restent stables au sein d'une session, les réponses restent correctement associées. Pour une nouvelle édition, vous pouvez dupliquer/adapter les missions et créer une nouvelle session depuis le cockpit.

---

## 8. Arborescence

```text
PGW-NSI-Quest-2026/
├── index.html                 # application élève
├── teacher.html               # cockpit enseignant
├── config.js                  # configuration du déploiement
├── config.example.js
├── manifest.webmanifest       # PWA
├── sw.js                      # cache hors-ligne
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── content.js
│   ├── storage.js
│   ├── supabase-client.js
│   └── teacher.js
├── assets/
│   └── icon.svg
├── supabase/
│   ├── schema.sql
│   └── promote_teacher.sql
└── .github/workflows/
    └── pages.yml
```

---

## 9. Principes de conception

- **terrain avant spectacle** : l'interface ne doit jamais gêner la saisie ;
- **preuve observable** : les questions encouragent les noms de stands, technologies, exemples et personnes interrogées ;
- **lien avec le programme NSI** : algorithmique, structures de données, bases de données, réseaux, programmation, architecture et sécurité ;
- **résilience réseau** : la PGW est un environnement où le réseau mobile peut être saturé ;
- **minimisation des données** : pas de compte e-mail élève ;
- **réutilisabilité** : les sessions sont séparées des contenus et peuvent être recréées chaque année.

## Sources événementielles

Les repères 2026 intégrés dans l'interface correspondent aux informations officielles disponibles au moment de la création : Paris Games Week du 22 au 25 octobre 2026, vendredi 23 octobre de 9 h 30 à 19 h, Paris Expo – Porte de Versailles, édition « Playground Edition ».
