# Kamoo Console — Logique métier

> Référence du **fond** (métier) indépendamment de la **forme** (direction visuelle).
> Sert de cahier des charges pour repartir sur une nouvelle peau sans perdre la logique.
> État : V1 mock (données côté client). Cible : V2 Supabase + server actions.

---

## 1. En une phrase

Kamoo est une **console d'opérations pour e-commerçants COD ouest-africains** (paiement à
la livraison). Le vendeur **source** des produits (souvent de Chine), les **vend** (Shopify /
publicité), puis Kamoo orchestre **l'après-vente** : **confirmation par appel** (closing),
**livraison**, **encaissement du cash**, et **règlement des partenaires**.

COD = *Cash On Delivery* : le client ne paie pas en ligne, il paie **en espèces à la livraison**.
Tout l'enjeu métier est là : confirmer la commande avant de se déplacer (éviter les colis
retournés), suivre la livraison, et récupérer le cash.

---

## 2. Les acteurs (rôles)

| Acteur | Rôle | Cardinalité | Contact |
|---|---|---|---|
| **Vendeur** | Utilisateur de la console (ex. « Aïcha Diop ») | — | — |
| **Closeuse** | Appelle les clients pour **confirmer** la commande COD | **1 active** (mono) | Chat in-app |
| **Livreur** | **Livre + encaisse le cash** ; services : `livraison`, `closing`, `entreposage` | **N** (multi) | Chat in-app |
| **Transitaire** | Gère le **fret Chine → Afrique** | **N** (multi) | Chat in-app |
| **Client final** | L'acheteur | N | **Tél / WhatsApp** |

> ⚠️ **Règle de contact** : les **partenaires** (closeuse / transitaire / livreur) se contactent
> **exclusivement via le chat in-app** (pas de téléphone externe). Seuls les **clients finaux**
> sont joignables par téléphone / WhatsApp.

---

## 3. Le cycle COD de bout en bout (colonne vertébrale)

```
  SOURCING            VENTE              CLOSING            LIVRAISON          BOUCLAGE          RÈGLEMENT
 (transitaire)       (Shopify)         (closeuse)          (livreur)         (auto)            (vendeur)
      │                  │                  │                  │                 │                  │
  Expédition  ──►   Commande   ──►   Appel client   ──►   Assignation  ──►  Cash encaissé  ──►  Paiement
  Chine→Afrique     créée/synch      confirme/annule      + livraison       + push Shopify     des partenaires
      │                  │                  │                  │                 │              (wallets)
  réappro stock     client ajouté    livraison_en_cours    livré / alerte    CA encaissé      « à payer »
  + coût acquis.    à la base         (ou annulé)                            fiche client MAJ
```

**Étapes détaillées :**

1. **Sourcing** — Le vendeur crée une **Expédition** Chine→Afrique via un **transitaire**
   (un ou plusieurs **colis**). À l'arrivée, ça **réapprovisionne le stock**
   (*approvisionnements*) et fixe le **coût d'acquisition** (prix FOB + part de transport
   répartie au prorata).
2. **Vente** — Via la **boutique Shopify** (ou campagnes pub Meta/TikTok). La commande Shopify
   est **synchronisée automatiquement** dans Kamoo (Closing) et le **client est ajouté/MAJ**
   dans la base.
3. **Closing** — La **closeuse appelle** le client pour confirmer.
   `nouvelle` → `rappelé` / `injoignable` → **`confirmée`** ou `annulée`.
4. **Assignation** — Commande confirmée → on **assigne un livreur**.
5. **Livraison** — Le livreur livre et **encaisse le cash**. Progression :
   `en cours` → **`livré`** ou **`alerte`** (incident).
6. **Bouclage (auto)** — Cash encaissé = **CA encaissé** ; la commande Shopify passe
   « **honorée & payée** » (**push de statut**) ; la **fiche client** est mise à jour.
7. **Règlement** — Le vendeur **paie les partenaires** (commissions closeuse / livreur, frais
   transitaire) via ses **wallets** (Wave / Orange Money). C'est le « **à payer** ».

---

## 4. Machines d'états

### 4.1 Statut Closing (`ClosingStatus`)

| Statut | Sens | Transition possible |
|---|---|---|
| `nouvelle` | Commande reçue, pas encore appelée | → appel |
| `rappele` | Rappel programmé (« reporter à demain ») | → ré-appel |
| `injoignable` | Client injoignable | → ré-appel |
| `livraison_en_cours` | **Confirmée** par la closeuse | → assignation livreur |
| `livre` | Livrée + **cash encaissé** | (terminal ✓) |
| `annule` | Annulée (avec motif) | (terminal ✗) |

**Actions** (poste de pilotage = la fiche commande) :
`confirmer` → `livraison_en_cours` · `reporter demain` → `rappele` · `injoignable` → `injoignable`
· `annuler` → `annule` (avec motif) · `assigner un livreur` (si confirmée & sans livreur)
· `marquer livrée` → `livre`.

### 4.2 Progression Livraison (`DeliveryProgress`)

| Progress | Libellé UI | Sens |
|---|---|---|
| `en_attente` | « En cours » | Livreur en route |
| `effectue` | « Effectuée » | Livré + encaissé |
| `alerte` | « Alerte » | Incident (à relancer : `retryDelivery`) |

### 4.3 Statut Expédition

`en_route` → `arrive` ; `en_attente_devis` (tant que le **devis Kamoo** n'a pas fixé le coût de transport).

---

## 5. Objets métier (entités) et règles

### Produit / Catalogue
- Champs : `sku`, `priceXof` (prix de vente), `costPriceXof?` (coût manuel optionnel),
  `stock` + `lowStockThreshold`, `photos`, `isActive`, `archived`, stats de vente.
- **Coût d'acquisition** : moyenne pondérée dérivée des **expéditions arrivées** (prix d'achat +
  part transport) ; sinon coût manuel ; sinon « marge non calculée ».
- **Marge = prix de vente − coût d'acquisition**.
- **Lien Shopify** : un produit est soit **lié à Shopify** (mapping `productId ↔ shopifyProductId`,
  source `imported` / `published` / `linked`), soit **« Hors Shopify »**.
- À la **création manuelle** : avertir que le produit **ne sera pas connecté à Shopify**, sauf à le
  **relier à un produit Shopify existant**.

### Expédition (Chine → Afrique)
- Colis (produits + photos), transitaire, mode de transport, statut, dates (ETA / arrivée).
- Le **devis Kamoo** fixe le coût de transport → complète le coût d'acquisition unitaire.
- À l'arrivée → **approvisionnement** = stock entrant lié au produit.

### Commande / Closing
- Items (produit, quantité, prix unitaire), client, **montant + devise**, source (`Shopify` / manuel),
  statut closing, **historique d'activité** (création, appels, rappels, commentaires, confirmation,
  annulation, assignation…), lien Shopify (`shopifyOrderId`, `shopifyName`).
- Récap financier : sous-total, total **à encaisser**, COGS, **marge nette**.

### Livraison
- Dérivée d'une commande confirmée + livreur assigné. Le **cash COD** est « à encaisser » puis
  « encaissé ». Note du livreur, créneau prévu, progression.

### Client (base CRM)
- Alimentée par les commandes (Shopify ou manuel). Segment, **valeur client encaissée**, panier
  moyen, taux de livraison, historique de commandes, insight (fidèle / à relancer).
- Joignable **tél / WhatsApp**.

### Finances
- **CA encaissé**, **à encaisser**, **à payer** (aux partenaires/fournisseurs), **marge**.
- **Dépense pub** : campagnes Meta / TikTok, coût par livré, statut de paiement.
- **Wallets** (Wave, Orange Money, compte bancaire) — défaut par wallet.
- **Facturation** : plans Free / Pro / Enterprise, factures/reçus.

### Disputes
- Litiges **vendeur ↔ partenaire** (livreur / closeuse / transitaire), avec motif et contexte.

---

## 6. Règles / invariants clés

1. **1 closeuse active** (mono) ; **N livreurs / N transitaires** (multi).
2. Si une **closeuse est active**, le service **« closing » d'un livreur est verrouillé**
   (on ne peut pas avoir deux pôles de closing en parallèle).
3. **Le closing précède toujours la livraison** : on n'assigne un livreur qu'après confirmation.
4. **Multi-marché** : 1 marché = 1 **pays** + 1 **boutique Shopify** + 1 **devise** + ses
   **partenaires** + son **entrepôt**. Marchés : **SN** (Sénégal), **CI** (Côte d'Ivoire),
   **CM** (Cameroun). Bascule de marché via la sidebar ; **toutes les données sont contextualisées
   au marché actif**.
5. **Partenaires = chat in-app uniquement** ; **clients = tél / WhatsApp**.
6. **Montant fidèle à la devise** de la boutique (USD/EUR ont des décimales ; XOF non) — ne pas
   arrondir les montants importés.

---

## 7. Intégrations

### Shopify (cœur)
- **Connexion** par marché : OAuth réel (mode **Live**) ou **Démo** (simulé). 1 boutique / marché.
- **Sync commandes → Closing** (pull) : la commande de la boutique arrive directement dans le
  pipeline d'appels ; le client est créé/MAJ. Dédup par `shopifyOrderId`. N° Kamoo = miroir du
  `name` Shopify (`#1002`).
- **Import produits → Catalogue** (pull) : tire les produits de la boutique dans le catalogue
  Kamoo (anti-doublon), avec lien `shopifyProductId`.
- **Publication produit → Shopify** (push, façon DSers) : pousse un produit Kamoo vers la boutique
  (permission explicite).
- **Push de statut** : à la livraison encaissée, la commande Shopify passe « honorée & payée ».
- Devise **auto-détectée** depuis Shopify (sauf choix manuel du vendeur qui prime).

### Publicité
- Meta / TikTok : dépense, conversions, **coût par livré** par produit (rentabilité réelle).

### Paiements
- Wallets mobile money (Wave, Orange Money) + compte bancaire pour encaisser/régler.

---

## 8. Surfaces (pages) → workflow

| Page | Rôle métier |
|---|---|
| **Vue d'ensemble** (Dashboard) | KPIs : à encaisser, à payer, CA, **entonnoir COD** (appelés → confirmés → livrés), états des commandes. |
| **Marketplace** | Recruter les partenaires (closeuses / transitaires / livreurs), services & tarifs, avis. |
| **Catalogue** (Boutique) | Produits : stock, rentabilité (CA / bénéfice net / marge), import & publication Shopify. |
| **Expéditions** | Sourcing Chine→Afrique : colis, transitaire, devis, suivi, réappro stock. |
| **Clients** | Base CRM : valeur, historique, segments. |
| **Closing** | Pipeline d'appels : confirmer / reporter / injoignable / annuler / assigner. |
| **Livraisons** | Suivi des livraisons : en cours / effectuées / alertes, cash encaissé. |
| **Disputes** | Litiges avec les partenaires. |
| **Finances** | Encaissé / à payer, pub, versements, mouvements. |
| **Paramètres** | Profil, sécurité, KYC, marchés, connexions (Shopify), wallets, facturation. |

---

## 9. Note technique (V1 → V2)

- **Mode zéro-data** : aucune fausse donnée par défaut. Le vendeur recrute ses partenaires et
  importe ses produits lui-même (catalogue vide au départ).
- **État côté client (V1)** : les données « réelles » vivent en **sessionStorage** via des
  *stores synchronisés* (`partners`, `closing`, `shopify`, `shopifyProducts`, produits, clients…),
  pas dans les mocks statiques. Conséquence : une **fiche détail par id** (produit, commande,
  client…) doit être un **Client Component** (pas un Server Component lisant un mock statique vide).
- **V2** : remplacement par **Supabase** + server actions + `revalidatePath`.

---

*Ce document décrit la logique métier. La direction visuelle (couleurs, typo, layout, composants)
peut être entièrement repensée sans toucher à ce qui précède : ce sont les **surfaces** et les
**transitions d'état** qui persistent.*
