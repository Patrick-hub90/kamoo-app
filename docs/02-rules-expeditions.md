# Phase 2.4 — Règles métier · Module Expéditions

> Document de référence Kamoo — règles métier qui guident le code (frontend, backend Supabase, RLS, triggers, fonctions).
> Toute évolution doit passer par ce document avant le code.

---

## 1. Acteurs et permissions

| Acteur | Peut créer | Peut lire | Peut modifier | Peut supprimer |
|---|---|---|---|---|
| **Vendeur** | Une expédition (ses propres) | Ses propres expéditions uniquement | Brouillon · annuler avant arrivée Chine | Jamais (soft delete via cancel) |
| **Transitaire** | Jamais | Expéditions qui lui sont assignées uniquement | Statut logistique · poids · photos · devis | Jamais |
| **Admin Kamoo** | Jamais (sauf cas spécial) | Toutes les expéditions (avec audit log) | Tout (modération, litiges) | Jamais (anonymisation possible) |

**Règle dure** : isolation par RLS Postgres. Un vendeur ne peut JAMAIS lire/modifier l'expédition d'un autre vendeur, même en cas de bug applicatif.

---

## 2. Cycle de vie d'une expédition

### 2.1 Statuts logistiques (3 valeurs MVP)

```
draft → awaiting_quote → received_china → arrived_destination
                                             ↘
                                              completed
```

| Statut | Sens | Qui le déclenche |
|---|---|---|
| `draft` | Brouillon vendeur, pas encore soumis | Vendeur (auto-save wizard) |
| `awaiting_quote` | Soumise, en attente de réception en Chine | Vendeur (clic Valider) |
| `received_china` | Reçue par le transitaire en Chine, devis émis | Transitaire |
| `arrived_destination` | Arrivée à l'entrepôt local | Transitaire |
| `completed` | Récupérée par le vendeur OU transférée vers Livraisons | Vendeur ou Système |
| `cancelled` | Annulée avant `received_china` | Vendeur |
| `refused` | Refusée par admin/transitaire (avec motif) | Admin / Transitaire |
| `disputed` | En litige (bloque les transitions normales) | Vendeur, Transitaire ou Admin |

### 2.2 Statuts paiement (2 valeurs MVP)

| Statut | Sens |
|---|---|
| `unpaid` | Pas payé (jamais de devis OU devis non réglé) |
| `paid` | Devis intégralement réglé via PSP |

### 2.3 Transitions autorisées

| De | Vers | Acteur autorisé | Conditions |
|---|---|---|---|
| `draft` | `awaiting_quote` | Vendeur | Au moins 1 colis avec nom + 1 photo + checkbox responsabilité cochée |
| `awaiting_quote` | `received_china` | Transitaire | Photos + poids + devis renseignés |
| `awaiting_quote` | `cancelled` | Vendeur | Toujours autorisé (gratuit) |
| `awaiting_quote` | `refused` | Admin | Motif obligatoire |
| `received_china` | `arrived_destination` | Transitaire | Si politique paiement = `upfront` → devis doit être `paid` |
| `received_china` | `cancelled` | Vendeur | Frais de réacheminement à la charge vendeur |
| `arrived_destination` | `completed` | Vendeur ou Système | Récupération confirmée OU transfert Livraisons |
| Tout statut | `disputed` | Tous | Bloque les autres transitions |

---

## 3. Règles de validation

### 3.1 Création d'une expédition (Vendeur)

- **Au moins 1 colis** par expédition. Maximum 20.
- Pour chaque colis : **nom requis** + **au moins 1 photo** requise. Poids et nombre de cartons facultatifs.
- **Pays de destination** = pays actif du sélecteur (auto). En mode "Global", bloquer la création.
- **Catégorie IA** détectée automatiquement à partir du nom + photos. Modifiable par le vendeur.
- **Mode de transport** : un mode incompatible avec la catégorie est grisé (matrice transitaire).
- **Checkbox responsabilité obligatoire** : "Je confirme que le contenu correspond à la catégorie déclarée."
- **Shipping mark généré côté serveur** au format `KMO-{country}-{seq5}`. Unique par couple vendeur×pays.

### 3.2 Réception en Chine (Transitaire)

- Le transitaire scanne ou saisit le shipping mark pour identifier l'expédition.
- **Photos** : recommandé 4 photos minimum (vue d'ensemble, étiquette, contenu, carton). MVP : 1 minimum.
- **Poids réel obligatoire** (kg).
- **Volume optionnel** (CBM, pertinent maritime).
- **Devis = poids × tarif unitaire + (frais éventuels)** = total. Pas de breakdown détaillé.
- Le transitaire peut **refuser** avec motif si contenu incompatible.

### 3.3 Devis (Transitaire)

- Émis uniquement si `received_china`.
- Composition : `weight_kg`, `volume_cbm` (optionnel), `unit_cost`, `total_xof`.
- **Validité 7 jours** (expirable, configurable par transitaire en V2).
- Modifiable par le transitaire tant que non payé.
- Une fois `paid`, immutable.

---

## 4. Règles financières

### 4.1 Politique paiement par transitaire

- `upfront` : le devis doit être `paid` AVANT que le transitaire ne change le statut vers `arrived_destination`.
- `on_arrival` : le transitaire peut expédier sans paiement préalable. Le paiement est dû à l'arrivée.

### 4.2 Flux de l'argent

- L'argent ne transite **jamais** par les comptes Kamoo.
- Vendeur paie sur PSP (Moneroo) → escrow Kamoo → libération vers le compte du transitaire après confirmation `arrived_destination`.
- Si dispute → fonds bloqués sur escrow jusqu'à résolution.

### 4.3 Annulation / Réacheminement

- Annulation gratuite tant que `awaiting_quote`.
- Si `received_china` et le vendeur veut annuler : frais de réacheminement à sa charge (envoyer à une autre adresse en Chine OU retourner au fournisseur).
- **Kamoo ne détruit jamais le colis.**

---

## 5. Notifications

### 5.1 Triggers obligatoires (vendeur)

| Événement | Canal | Contenu |
|---|---|---|
| Expédition soumise | in-app | "Votre expédition est en attente de réception en Chine" |
| Colis reçu en Chine | in-app + SMS + WhatsApp | "Le transitaire a reçu votre colis. Devis : X F CFA" |
| Devis émis (si différent de réception) | in-app | "Devis émis pour {code}" |
| Si `upfront` et non payé après 48h | in-app + SMS | "Votre devis attend paiement" |
| Colis arrivé destination | in-app + SMS + WhatsApp | "Votre colis est arrivé à {city}. Récupérez-le à {address}" |
| Litige ouvert | in-app + email | "Litige sur l'expédition {code}" |

### 5.2 Préférences vendeur

- Configurables dans Paramètres : in-app (toujours actif), SMS (opt-in), WhatsApp (opt-in), email (opt-in).
- Configurable par type d'événement (granularité au niveau famille : expéditions / commandes / paiements / litiges).

---

## 6. Règles de sécurité (RLS Supabase)

### 6.1 Table `expeditions`

```
POLICY vendor_select_own
  ON expeditions FOR SELECT
  USING (vendor_id = (SELECT vendor_id FROM profiles WHERE user_id = auth.uid()))

POLICY transitaire_select_assigned
  ON expeditions FOR SELECT
  USING (transitaire_id = (SELECT transitaire_id FROM profiles WHERE user_id = auth.uid()))

POLICY admin_select_all
  ON expeditions FOR SELECT
  USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin')
```

Idem pour INSERT / UPDATE avec vérifications adaptées.

### 6.2 Audit log

- Toute transition de statut sur une expédition crée une ligne dans `expedition_status_history`.
- Toute action admin sensible logguée dans `admin_audit_log`.

---

## 7. Cas limites

### 7.1 Vendeur supprime son compte

- Anonymisation : nom remplacé par "Vendeur supprimé", données conservées (audit légal).
- Expéditions en cours : escalade à l'admin pour finalisation.

### 7.2 Transitaire suspendu

- Toutes les expéditions `awaiting_quote` qui lui sont assignées sont **réassignées** à un autre transitaire.
- Toutes les expéditions `received_china` continuent normalement (le transitaire reste responsable jusqu'à transfert effectif).

### 7.3 Colis perdu

- Vendeur signale via support → ouvre un litige (`disputed`).
- Admin enquête (preuves : photos, dates, comm transitaire).
- Si responsabilité transitaire : indemnisation depuis fonds de garantie + retenue sur transitaire.

### 7.4 Litige paiement

- Vendeur conteste un devis : statut → `disputed`, paiement bloqué sur escrow.
- Délai admin pour trancher : **72h max**.

### 7.5 Catégorie incompatible révélée à la réception

- Transitaire détecte un produit incompatible (vendeur a triché sur la catégorie).
- Transitaire change le statut → `refused` avec motif.
- Vendeur a 3 options : changer de mode (si possible), réacheminer (frais à sa charge), reprendre le colis chez le fournisseur.
- **Compteur "récidive vendeur"** incrémenté : 3 incidents = suspension temporaire (V2).

---

## 8. À implémenter en V2 (parking)

- Validation IA automatique des photos (détection contrefaçons, contenu interdit)
- Tracking transporteur externe (numéro CMA CGM, etc.)
- Multi-shipping marks par pays
- Historique de prix par mode/transitaire
- Notation bilatérale après chaque expédition
- Stats détaillées transitaire (taux de réussite, délai moyen, etc.)
