window.PGW_CONTENT = {
  editionLabel: "Paris Games Week 2026 · Playground Edition",
  visitLabel: "Vendredi 23 octobre 2026 · 9 h 30 → 19 h",
  intro: "Transforme ta visite en enquête d’informatique. Observe, questionne, compare et relie ce que tu vois aux notions de Terminale NSI.",
  totalXp: 1350,
  badges: [
    { key: "starter", minXp: 100, label: "Player One", icon: "◈" },
    { key: "campus", minXp: 300, label: "Campus Scout", icon: "⌁" },
    { key: "code", minXp: 600, label: "Code Hunter", icon: "</>" },
    { key: "ai", minXp: 850, label: "AI Analyst", icon: "◎" },
    { key: "pro", minXp: 1050, label: "Pro Link", icon: "◇" },
    { key: "boss", minXp: 1350, label: "NSI Quest Master", icon: "★" }
  ],
  missions: [
    {
      key: "launch",
      order: 1,
      title: "Launch Zone",
      kicker: "Préparer sa stratégie",
      icon: "01",
      xp: 100,
      description: "Définis ce que tu veux chercher avant de te disperser dans le salon.",
      questions: [
        {
          key: "interests",
          type: "checkboxes",
          label: "Quels domaines veux-tu explorer en priorité ?",
          required: true,
          options: ["Développement / programmation", "Game design", "3D / graphisme", "Cybersécurité / réseau", "IA / data", "Hardware", "Accessibilité", "Orientation"]
        },
        {
          key: "objectives",
          type: "textarea",
          label: "Choisis deux objectifs personnels pour la journée.",
          placeholder: "Ex. : comprendre comment un jeu multijoueur synchronise les joueurs ; identifier une formation post-bac adaptée à mon profil.",
          required: true,
          minLength: 30
        }
      ]
    },
    {
      key: "campus",
      order: 2,
      title: "Campus Scan",
      kicker: "Comparer les formations",
      icon: "02",
      xp: 200,
      description: "Repère au moins deux formations et compare des critères vérifiables plutôt que des slogans.",
      questions: [
        { key: "school1", type: "text", label: "Formation / école n°1", required: true, placeholder: "Nom exact" },
        { key: "diploma1", type: "text", label: "Diplôme / titre préparé", required: true },
        { key: "admission1", type: "text", label: "Admission / prérequis", required: true },
        { key: "coding1", type: "text", label: "Programmation : langages, volume ou projets cités", required: true },
        { key: "workstudy1", type: "text", label: "Alternance / stages", required: true },
        { key: "distinct1", type: "textarea", label: "Un point distinctif et une preuve observable", required: true, minLength: 20 },
        { key: "school2", type: "text", label: "Formation / école n°2", required: true, placeholder: "Nom exact" },
        { key: "diploma2", type: "text", label: "Diplôme / titre préparé", required: true },
        { key: "admission2", type: "text", label: "Admission / prérequis", required: true },
        { key: "coding2", type: "text", label: "Programmation : langages, volume ou projets cités", required: true },
        { key: "workstudy2", type: "text", label: "Alternance / stages", required: true },
        { key: "distinct2", type: "textarea", label: "Un point distinctif et une preuve observable", required: true, minLength: 20 },
        { key: "bestfit", type: "textarea", label: "Laquelle te paraît la plus adaptée à un profil NSI ? Justifie avec deux critères précis.", required: true, minLength: 50 }
      ]
    },
    {
      key: "nsi",
      order: 3,
      title: "Code Scanner",
      kicker: "Où se cache la NSI ?",
      icon: "03",
      xp: 300,
      description: "Choisis un jeu, un outil ou une démo. Analyse les mécanismes invisibles derrière l’écran.",
      questions: [
        { key: "target", type: "text", label: "Stand / entreprise / école observé", required: true },
        { key: "demo", type: "text", label: "Jeu, outil ou démonstration", required: true },
        { key: "algo", type: "textarea", label: "Algorithmique — Quel problème doit être résolu rapidement ?", hint: "Déplacement, collisions, pathfinding, matchmaking, rendu…", required: true, minLength: 30 },
        { key: "algoProof", type: "text", label: "Preuve / exemple concret observé", required: true },
        { key: "data", type: "textarea", label: "Structures de données — Quelles données faut-il organiser et sous quelle forme plausible ?", hint: "Joueurs, inventaire, carte, événements, scores, objets…", required: true, minLength: 30 },
        { key: "dataProof", type: "text", label: "Preuve / exemple concret observé", required: true },
        { key: "db", type: "textarea", label: "Bases de données — Quelles informations doivent être conservées ? Donne une donnée et une clé possible.", required: true, minLength: 30 },
        { key: "dbProof", type: "text", label: "Preuve / exemple concret observé", required: true },
        { key: "network", type: "textarea", label: "Réseaux — Quelles informations circulent entre client et serveur ? Quelle contrainte domine ?", hint: "Latence, débit, sécurité, synchronisation…", required: true, minLength: 30 },
        { key: "networkProof", type: "text", label: "Preuve / exemple concret observé", required: true },
        { key: "stack", type: "textarea", label: "Programmation — Quel langage, moteur ou environnement est utilisé ? Pourquoi ce choix ?", required: true, minLength: 30 },
        { key: "stackProof", type: "text", label: "Preuve / exemple concret observé", required: true },
        { key: "techQuestion", type: "textarea", label: "Question technique posée à un professionnel / étudiant et réponse essentielle", required: true, minLength: 40 },
        { key: "newTerm", type: "text", label: "Un terme technique nouveau + sa définition", required: true },
        { key: "courseLink", type: "textarea", label: "À quelle notion de NSI cela se relie-t-il ? Explique.", required: true, minLength: 40 },
        { key: "pythonChallenge", type: "textarea", label: "Défi NSI — « Si je devais programmer cette fonctionnalité en Python, j’aurais besoin de… »", hint: "Cite au moins une structure de données et un traitement algorithmique.", required: true, minLength: 50 }
      ]
    },
    {
      key: "innovation",
      order: 4,
      title: "Innovation Lab",
      kicker: "IA, données et fiabilité",
      icon: "04",
      xp: 250,
      description: "Distingue ce qui est réellement calculé, automatisé ou amélioré de ce qui relève du discours commercial.",
      questions: [
        { key: "innovationType", type: "checkboxes", label: "Type(s) d’innovation observée(s)", required: true, options: ["IA générative", "IA de comportement", "VR / AR", "Cloud gaming", "Hardware", "Accessibilité", "Outil de développement", "Autre"] },
        { key: "innovationStand", type: "text", label: "Nom du stand / projet", required: true },
        { key: "problem", type: "textarea", label: "Quel problème est traité ?", required: true, minLength: 25 },
        { key: "inputs", type: "textarea", label: "Quelles sont les entrées / données utilisées ?", required: true, minLength: 20 },
        { key: "output", type: "textarea", label: "Quel résultat est produit ?", required: true, minLength: 20 },
        { key: "limit", type: "textarea", label: "Une limite, un risque ou un coût identifié", required: true, minLength: 25 },
        { key: "aiUses", type: "checkboxes", label: "Si une IA est réellement utilisée, que fait-elle ?", required: false, options: ["Génère du contenu", "Prédit / classe", "Pilote un comportement", "Analyse des joueurs", "Assiste les développeurs", "Aucune IA démontrée"] },
        { key: "aiData", type: "text", label: "Données nécessaires à cette IA (si applicable)", required: false },
        { key: "aiDecision", type: "text", label: "Décision / sortie produite (si applicable)", required: false },
        { key: "humanControl", type: "text", label: "Contrôle humain prévu (si applicable)", required: false },
        { key: "aiLimit", type: "text", label: "Une limite évoquée : erreur, biais, coût, droit, données…", required: false },
        { key: "testing", type: "textarea", label: "Fiabilité — Comment testent-ils qu’une nouvelle version n’a pas cassé une fonctionnalité qui marchait ?", required: true, minLength: 40 }
      ]
    },
    {
      key: "pro",
      order: 5,
      title: "Pro Link",
      kicker: "Rencontrer le métier",
      icon: "05",
      xp: 200,
      description: "Interroge une personne qui travaille ou se forme dans un métier technique.",
      questions: [
        { key: "job", type: "text", label: "Métier", required: true },
        { key: "path", type: "textarea", label: "Études / parcours", required: true, minLength: 20 },
        { key: "skill", type: "textarea", label: "Compétence technique la plus importante", required: true, minLength: 20 },
        { key: "difficulty", type: "textarea", label: "Une difficulté réelle du métier", required: true, minLength: 20 },
        { key: "advice", type: "textarea", label: "Un conseil donné à un élève de Terminale NSI", required: true, minLength: 20 },
        { key: "projectEvidence", type: "textarea", label: "Demande un exemple de projet étudiant / junior et ce qui y est évalué techniquement. Note la réponse.", required: true, minLength: 40 }
      ]
    },
    {
      key: "boss",
      order: 6,
      title: "Boss Final",
      kicker: "Construire un bilan exploitable",
      icon: "06",
      xp: 300,
      description: "Montre ce que la visite t’a appris sur l’informatique et ton orientation, pas seulement ce que tu as aimé.",
      questions: [
        { key: "top1", type: "textarea", label: "Découverte n°1 + pourquoi elle est importante pour toi", required: true, minLength: 30 },
        { key: "top2", type: "textarea", label: "Découverte n°2 + pourquoi elle est importante pour toi", required: true, minLength: 30 },
        { key: "top3", type: "textarea", label: "Découverte n°3 + pourquoi elle est importante pour toi", required: true, minLength: 30 },
        { key: "nsiConcept", type: "radio", label: "Une notion de NSI vue « en vrai »", required: true, options: ["Structures de données", "Bases de données", "Réseaux", "Algorithmique", "Programmation / récursivité", "Architecture / système", "Sécurisation des communications"] },
        { key: "nsiExplain", type: "textarea", label: "Explique le lien avec un exemple précis observé sur le salon.", required: true, minLength: 60 },
        { key: "orientation", type: "radio", label: "Une formation ou un métier mérite-t-il que tu poursuives tes recherches ?", required: true, options: ["Oui", "Peut-être", "Non", "Je ne sais pas encore"] },
        { key: "orientationTarget", type: "text", label: "Formation / métier à approfondir", required: false },
        { key: "orientationWhy", type: "textarea", label: "Pourquoi ?", required: true, minLength: 30 },
        { key: "nextAction", type: "text", label: "Prochaine action concrète", hint: "JPO, site, Parcoursup, portfolio, projet…", required: true },
        { key: "critical", type: "radio", label: "Regard critique sur le salon", required: true, options: ["La PGW donne une image réaliste des métiers du jeu vidéo", "Elle met surtout en avant la dimension commerciale", "Les deux sont équilibrés"] },
        { key: "criticalWhy", type: "textarea", label: "Argumente avec des faits observés.", required: true, minLength: 60 },
        { key: "summary", type: "textarea", label: "Synthèse express — « Ce que la PGW 2026 m’a appris sur l’informatique et mon orientation… »", required: true, minLength: 100, maxLength: 700 }
      ]
    }
  ]
};
