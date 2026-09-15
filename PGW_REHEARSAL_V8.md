# PGW REHEARSAL GATE — V8.13

## But
Répétition générale du scénario du 23 octobre 2026 sans modifier les six missions ni leurs masters validés.

## Matériel minimum
- 1 poste enseignant sur `teacher.html`.
- 6 navigateurs/appareils élèves distincts (ou profils/incognito réellement isolés).
- Session réelle `PGW26` laissée ouverte pendant la répétition.
- Un appareil désigné **RÉSEAU-COUPÉ**.

## Faux élèves
| Appareil | Pseudo | Classe | Incident imposé |
|---|---|---|---|
| A | REHEARSAL-A | TNSI-QA | parcours nominal |
| B | REHEARSAL-B | TNSI-QA | rechargement après M01 |
| C | REHEARSAL-C | TNSI-QA | réseau coupé pendant une mission |
| D | REHEARSAL-D | TNSI-QA | fermeture/réouverture du navigateur |
| E | REHEARSAL-E | TNSI-QA | tentative d'ouverture d'une mission verrouillée |
| F | REHEARSAL-F | TNSI-QA | parcours nominal + contrôle mobile |

## Chronologie professeur
### T0 — Ouverture
1. Ouvrir le cockpit enseignant et sélectionner PGW NSI 2026.
2. Vérifier **Inscriptions ouvertes** et le code `PGW26`.
3. Les six faux élèves rejoignent avec code + classe + pseudo.
4. Gate : les six apparaissent dans le cockpit, sans compte complexe.

### T+5 — M01
1. Les six valident M01.
2. B recharge la page : réponses et progression doivent rester.
3. E tente M03 avant M02 : accès refusé.
4. Gate : M01 = 100 XP ; M02 déverrouillée ; aucun saut de mission.

### T+10 — Incident réseau
1. Couper le réseau de C.
2. C poursuit et valide la mission disponible.
3. Son appareil doit afficher **Ne ferme pas · envoi en attente**.
4. Le cockpit ne doit pas inventer un état pending : il montre seulement une remontée vieillissante.
5. Rétablir le réseau.
6. Gate : queue vidée automatiquement puis message vert **Données envoyées · tu peux quitter**.

### T+15 — Reprise navigateur
1. D ferme puis rouvre le navigateur sur le même appareil.
2. Gate : progression locale conservée et aucune duplication serveur après synchronisation.

### T+20 — Contrôle enseignant
1. Actualiser le cockpit.
2. Vérifier pseudo, classe, missions terminées, XP, fraîcheur de remontée et détail des réponses.
3. Ouvrir plusieurs drawers élève.
4. Gate : aucune donnée d'un autre rôle exposée ; aucune clé privilégiée côté navigateur.

### T+25 — Fin de sortie
1. Ouvrir **Contrôle de fin de visite**.
2. Fermer les nouvelles inscriptions.
3. Vérifier le libellé **Inscriptions fermées · synchronisation maintenue**.
4. Un appareil déjà relié effectue une dernière modification : elle doit encore se synchroniser.
5. Une nouvelle identité tente de rejoindre la session : elle doit être refusée.
6. Traiter tous les élèves signalés **À vérifier avant départ**.
7. Chaque appareil concerné doit afficher le message vert avant fermeture.

### T+30 — Export
1. Actualiser une dernière fois le cockpit.
2. Exporter le CSV final.
3. Vérifier : 6 pseudos attendus, classes, missions terminées, XP, dernière remontée, réponses.
4. Gate : aucune ligne élève manquante ; aucune duplication d'une réponse idempotente.

## Critères GO / NO-GO
**GO** uniquement si :
- 6/6 JOIN réussis ;
- aucune réponse perdue après reload/offline ;
- verrouillage séquentiel intact ;
- rattrapage automatique après retour réseau ;
- 6/6 appareils quittent avec confirmation verte ;
- fermeture des inscriptions bloque seulement les nouveaux JOIN ;
- cockpit et export cohérents avec Supabase ;
- aucune erreur JS bloquante/404 applicative ;
- Quality Gate CI reste vert.

**NO-GO** si une seule perte de réponse, duplication, progression incohérente, contournement du verrouillage, faux état de synchronisation ou impossibilité d'export est observé.

## Discipline
Un échec produit un ticket de défaut reproductible : appareil, étape, attendu, observé, état réseau, capture/console si utile. On corrige uniquement le défaut mesuré, puis on rejoue le scénario concerné et la CI. Aucun changement esthétique des six missions pendant ce gate.
