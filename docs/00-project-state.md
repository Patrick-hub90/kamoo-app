# 🎯 Kamoo — État du projet (document maître)

> **Document de référence** à charger au début de toute nouvelle conversation.
> Mis à jour : 1ᵉʳ mai 2026.
> Date cible MVP : **15 octobre 2026**.

---

## 1. Le projet en 30 secondes

**Kamoo** = plateforme SaaS de mise en relation pour e-commerçants ouest-africains.
Tagline : *"Vendez. On s'occupe du reste."*

**Pitch** : Le dropshipping pour l'Afrique. Le vendeur se concentre sur son marketing, Kamoo l'aide à trouver les bons partenaires (transitaires, closeuses, livreurs) et orchestre le flux logistique sans toucher à l'argent.

**Marchés V1** : Sénégal · Côte d'Ivoire · Cameroun

**Fondateur** : Béninois basé à Cotonou, e-commerçant lui-même depuis 2022. Solo founder bootstrapped, code en autonomie avec Claude Code.

---

## 2. Architecture conceptuelle clé

### 2.1 Modèle économique
- **SaaS pur** : abonnement vendeur uniquement
- **Pas de commission sur les flux financiers en V1**
- **Kamoo ne touche jamais l'argent** (position d'intermédiaire)

### 2.2 Modèle marketplace : "hybride curé"
- N'importe qui peut postuler (closeuse, livreur, transitaire)
- Kamoo vérifie l'identité (KYC) à l'entrée
- Le marché s'auto-régule via notation et avis
- Anti-fraude V1 minimaliste : **KYC + OTP téléphone uniquement** (pas de caution, pas d'escrow)

### 2.3 Flux d'argent : Kamoo = "livre de comptes partagé"
- Chaque mouvement d'argent réel (cash, Mobile Money) est **déclaré** par celui qui paye
- L'autre partie **confirme** (ou conteste)
- Kamoo trace tout, ne touche à rien
- Si désaccord → dispute manuelle, intervention Kamoo possible **après 72h** sur demande

### 2.4 Rôles
| Rôle | Interface | Pays |
|---|---|---|
| **Vendeur** | Desktop | Multi-pays via concept "Marché" |
| **Closeuse** | Mobile PWA | Mono-pays (1 closeuse/marché côté vendeur, multi-vendeurs côté closeuse) |
| **Livreur** | Mobile PWA | Mono-ville |
| **Transitaire** | Desktop+Mobile | Basé en Chine, sert plusieurs pays |
| **Admin Kamoo** | Desktop | Toutes opérations, intervention rare |

### 2.5 Concept "Marché" (à la Shopify)
- 1 compte Kamoo (vendeur) = 1 identité
- N "Marchés" sous ce compte = 1 marché par pays
- Chaque marché a ses propres : boutique Shopify, partenaires, finances, stock
- Sélecteur de marché en haut = recharge totale du contexte
- Mode **"Vue globale"** = lecture seule consolidée (finances, stats)

---

## 3. Stack technique validée

```
Frontend & API : Next.js 16 (App Router, Turbopack) + TypeScript
Styling        : Tailwind v4 + shadcn/ui (Base UI sous le capot)
DB             : Supabase (Postgres + Auth + Storage) ← pas encore connecté
Hosting        : Vercel (Europe : Paris/Francfort)
PSP            : Moneroo + CinetPay (Mobile Money Afrique)
KYC            : Smile Identity (à intégrer)
SMS/WhatsApp   : Africa's Talking (à intégrer)
Email          : Resend (à intégrer)
IA             : Claude API (validation produit, scoring)
Mobile         : PWA (pas de native en V1)
```

**Hébergement projet** : `C:\Users\user\Documents\Kamoo\kamoo-app`
**Repo Git** : local, pas encore push

---

## 4. Design system Kamoo

### Palette (validée avec Claude Design)
- **Primaire (CTA)** : Orange `#F97316` (kamoo-orange-500)
- **Secondaire (nav, devis)** : Bleu marine `#0F2A52` (kamoo-blue-900)
- **Fond** : Crème `#FAFAF7` (paper)
- **Statuts** : jaune (attente) / bleu (en cours) / orange (action) / vert (terminé) / gris (annulé) / rouge (refusé)

### Typo
- **Display** : Plus Jakarta Sans (titres)
- **Corps** : Inter (texte)
- **Mono** : JetBrains Mono (codes, IDs)

### Principes UX
1. **Simplicité Wave** : 1 action principale par écran
2. **Vouvoiement** systématique vendeur (jamais "tu")
3. **Devise** : "F CFA" partout (jamais XOF/XAF)
4. **Noms ouest-africains** dans les exemples (Aïcha Diop, Mamadou Koné, etc.)
5. **Mobile-terrain, desktop-bureau** (vendeur desktop, partenaires mobile)
6. **Optimiser, ne pas changer les habitudes**

---

## 5. Modules — état d'avancement

### 5.1 Sidebar finale

```
TABLEAU DE BORD
  🏠  Vue d'ensemble                   ⏳ stub

DÉCOUVRIR
  🛒  Marketplace
        ├─ Transitaires                ✅ liste + profil [slug]
        ├─ Closeurs                    ⏳ stub
        └─ Livreurs                    ⏳ stub

MON ACTIVITÉ
  📦  Expéditions                      ✅ liste + détail + wizard création
  🛒  Boutique                          ⏳ stub (catalogue produits)
  👥  Clients                           ⏳ stub (renommé depuis Commandes)
  📞  Closing                           ✅ tableau Shopify-style + détail
  🚚  Livraisons                        ⏳ stub
  💰  Finances                          ⏳ stub (livre de comptes consolidé)

COMPTE
  ⚙️  Paramètres                        ⏳ stub (compte + marchés)
```

### 5.2 État détaillé Module Expéditions

| Phase | État |
|---|---|
| 2.1 User stories | ✅ ~50 stories validées |
| 2.2 Schéma 12 entités | ✅ |
| 2.3 UI vendeur | ✅ Liste + Détail + Wizard 3 étapes (Colis/Transport/Confirmation) |
| 2.4 Règles métier | ✅ `docs/02-rules-expeditions.md` |
| Marketplace transitaires | ✅ Liste + Profil [slug] |

**Décisions clés Expéditions** :
- **3 statuts logistiques** : Reçu en Chine / En attente devis / Arrivé à destination
- **2 statuts paiement** : Payé / Non payé
- **Pas de tracking externe** (carrier comme CMA CGM)
- **Devis simplifié** : poids + volume (CBM) + coût/unité + total
- **Wizard 3 étapes** : Colis (photos + nom + poids facultatif), Transport (catégorie IA détectée + tarif/mode), Confirmation (récap + shipping mark)
- **Garde-fous validation produit** : politique transitaire affichée + checkbox responsabilité + encadré "que se passe-t-il si refusé"
- **Logique pays unifiée** : sélecteur top = source de vérité, pas de doublon

### 5.3 État détaillé Module Closing

| Phase | État |
|---|---|
| 2.1 User stories | ✅ vendeur + closeuse |
| 2.2 Schéma | ✅ (avec cash_movements transverse + reviews + tarifs closeuse) |
| 2.3a UI vendeur | ✅ Liste tableau Shopify-style + Détail [id] (stub) |
| 2.3b UI closeuse mobile | ⏳ pour plus tard |
| 2.4 Règles métier | ⏳ |

**Décisions clés Closing** :
- **5 statuts** : Nouvelle / Rappelé / Livraison en cours / Annulé / Injoignable
- **Tableau type Shopify** : N° / Produit / Qté / Total / Client / Téléphone / WhatsApp / Statut / Commentaire / Compte à rebours
- **Pills statut** : largeur uniforme 140px, fond plein code couleur
- **Compte à rebours** : `HH:MM:SS` ou `2j:HH:MM:SS`, rouge gras, update toutes les secondes
- **Ligne rouge** si countdown expiré (`bg-red-50`)
- **Clic ligne** → `/closing/[id]` détail
- **1 closeuse par marché** (côté vendeur) / multi-vendeurs (côté closeuse)
- **Closeuse fixe son tarif** dans la marketplace
- **Avis = note ★ + commentaire** (après 1 mois minimum de collaboration)
- **Pas de score "bon payeur"** sur le profil vendeur (logique Fiverr)
- **Widget livraison** : date+heure précise via datetime picker
- **Mauvais payeur** = bannissement admin sur signalement

### 5.4 Recherche utilisateurs faite (Phase 1.2 + retours closeuses)

**5 personas** documentés :
- **Vendeur** : 25-40 ans, Afrique de l'Ouest, vend via Shopify, importe 1-2x/mois de Chine
- **Closeuse** : femme 22-30 ans, à la maison, mobile-first, payée par livraison réussie (~1000 F CFA)
- **Livreur** : mobile + GPS, encaisse cash + Mobile Money (majoritaire), scoring consommateur
- **Transitaire** : 1 par pays, qualité variable, photo + pesée + confirmation produit
- **Admin Kamoo** : modèle scalable (IA + automation), framework litiges 4 catégories

**Retours closeuses (SN + CI)** :
- Phone qui rame quand trop d'appels → app légère obligatoire
- 2 rappels min pour joindre client
- Questions clients récurrentes (fabricant, garantie) → fiche produit accessible 1 clic
- Refus = manque d'argent + refus payer transport
- Adresses floues (région ≠ ville) → besoin commune obligatoire
- Heures travail : 8h30/9h - 17h/18h, livreurs cutoff 15h30/16h
- Workflow Shopify + Close Pro = à unifier dans Kamoo

---

## 6. Décisions stratégiques posées

### 6.1 Décisions verrouillées
- ✅ Marketplace hybride curé (KYC + ratings, pas de gestion d'argent)
- ✅ MVP date cible : **15 octobre 2026**
- ✅ Pas de Cadrage légal pour V1 (sera fait en parallèle plus tard, on lance vite)
- ✅ Lancement direct sur 3 pays (Sénégal, CI, Cameroun) avec partenaires existants du fondateur
- ✅ Modèle Marché à la Shopify (1 compte, N marchés-pays)
- ✅ Anti-fraude V1 = KYC + OTP uniquement (pas de caution, pas d'escrow)
- ✅ Pivot vers code direct (Phase 2.3 wireframes + Phase 3 design system fusionnés dans le code)
- ✅ Phase 1.3 cadrage légal **en pause** (pas bloquant pour MVP)
- ✅ **Pas de KPI numérique public sur les profils partenaires** (closeuses + livreurs).
  Cohérent avec "pas de score 'bon payeur' public sur le profil vendeur" déjà acté.
  Raisons : casse le cold start des nouveaux partenaires, encourage le cherry-picking
  (refus des cas difficiles pour préserver la stat), bruit statistique sur petits volumes,
  pression mentale sur les partenaires, vendeurs sans culture stat. **Reste visible publiquement** :
  note ★ + nb d'avis + badge statut (Nouveau / Certifié Kamoo) + ancienneté.
  **Reste calculé en interne** pour le tier auto + matching algorithmique + dashboard privée
  du partenaire (pour s'auto-évaluer).

### 6.2 Règle anti-procrastination (5 règles)
1. Critères "good enough" définis AVANT chaque phase
2. Parking V2 pour tout ce qui n'est pas critique
3. Time-box par phase (max 4 sessions/module)
4. "Ship even if ugly" — beauté vient des itérations clients
5. Date cible MVP visible et défendue

### 6.3 Parking V2 explicite
- Marketplace Closeurs + Livreurs (pages liste)
- Validation IA produit photos
- Tracking carrier externe
- Multi-shipping marks par pays
- Score "bon payeur" public
- Médiation par templates avant Kamoo
- Auto-suggestion arguments closeuse pendant l'appel
- Score "Closeuse Premium"
- Marketplace stockistes (partenariat Teliaw potentiel)
- **Personnalisation des vues vendeur (UI flexibility)** :
  - Choisir quels onglets afficher (Closing, Expéditions, Livraisons, etc.) et leur ordre
  - Choisir quelles colonnes afficher dans chaque tableau + leur ordre + leur largeur
  - Sauvegarder plusieurs "vues" nommées par module (ex : "Vue Aïcha", "Vue weekend")
  - Préférences stockées par utilisateur (Supabase user settings)
  - Inspiration : Linear views, Notion databases, Airtable views

---

## 7. Concurrents identifiés

| Nom | Périmètre | Verdict |
|---|---|---|
| **EasyAfrik** | Dashboard SaaS Shopify | Pas concurrent direct (juste gestion) |
| **Storeino** (Maroc) | Création boutique + COD + call center | Plus proche en esprit, 7 ans sans traction visible |
| **Teliaw** | Fulfillment décentralisé Afrique | Indirect, futur partenaire potentiel |

**Conclusion** : Aucun concurrent ne fait le périmètre intégré Kamoo. Tu es seul sur 9 capacités majeures (import Chine + closing marketplace + livraison COD + finances + multi-pays + Mobile Money + scoring consommateur + pré-validation catégorie/mode + confirmation photo avant départ).

---

## 8. Structure de fichiers du projet

```
kamoo-app/
├── docs/
│   ├── 00-project-state.md       ← CE DOCUMENT
│   └── 02-rules-expeditions.md   ← Règles métier Expéditions
├── public/
│   └── transitaires/             ← Logos/banners transitaires (à uploader)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Landing publique
│   │   └── (vendor)/             ← Routes vendeur (sidebar + topbar)
│   │       ├── layout.tsx
│   │       ├── dashboard/        ← stub
│   │       ├── expeditions/
│   │       │   ├── page.tsx              ← Liste avec mocks
│   │       │   ├── nouvelle/page.tsx     ← Wizard 3 étapes
│   │       │   └── [id]/page.tsx         ← Détail expédition
│   │       ├── boutique/         ← stub
│   │       ├── clients/          ← stub (renommé Commandes)
│   │       ├── closing/
│   │       │   ├── page.tsx              ← Tableau Shopify-style
│   │       │   └── [id]/page.tsx         ← Détail commande (stub)
│   │       ├── livraisons/       ← stub
│   │       ├── finances/         ← stub
│   │       ├── parametres/       ← stub
│   │       └── marketplace/
│   │           ├── page.tsx              ← stub overview
│   │           ├── transitaires/
│   │           │   ├── page.tsx          ← Liste cards
│   │           │   └── [slug]/page.tsx   ← Profil détaillé
│   │           ├── closeurs/page.tsx     ← stub
│   │           └── livreurs/page.tsx     ← stub
│   ├── components/
│   │   ├── ui/                   ← shadcn (button, calendar, popover, etc.)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       ← 4 sections + sous-menus marketplace
│   │   │   ├── topbar.tsx        ← Cloche + sélecteur Marché
│   │   │   └── country-selector.tsx
│   │   └── kamoo/
│   │       ├── status-pill.tsx
│   │       ├── stat-card.tsx
│   │       ├── shipment-card.tsx        ← Carte expédition
│   │       ├── transitaire-card.tsx     ← Carte marketplace
│   │       ├── mode-accordion.tsx       ← Accordéon modes transport
│   │       ├── copy-button.tsx
│   │       ├── countdown.tsx            ← HH:MM:SS rouge gras
│   │       ├── expedition-history.tsx
│   │       ├── date-range-filter.tsx    ← Calendrier range custom
│   │       └── stub-page.tsx
│   └── lib/
│       ├── utils.ts                     ← cn (className helper)
│       ├── format.ts                    ← formatXOF
│       ├── supabase/
│       │   ├── client.ts                ← Client browser (vide pour l'instant)
│       │   └── server.ts                ← Client serveur
│       ├── data/
│       │   ├── countries.ts             ← SN, CI, CM
│       │   ├── transport-modes.ts       ← Maritime, Air std, Air express + tarifs
│       │   ├── categories.ts            ← Cosmétique, Mode, etc. + matrice compat
│       │   ├── mock-expeditions.ts      ← 6 expéditions exemples
│       │   ├── mock-expedition-detail.ts
│       │   ├── mock-transitaires.ts     ← 7 transitaires (Trust + 6 autres)
│       │   └── mock-closing.ts          ← 7 commandes en closing
│       └── types/
│           ├── expedition.ts
│           ├── expedition-detail.ts
│           ├── transitaire.ts
│           └── closing.ts
└── .env.local                    ← Placeholders Supabase, etc.
```

---

## 9. Prochaines étapes (ordre recommandé)

1. ⏳ **Module Closing — détail commande** (vrai contenu, pas stub)
2. ⏳ **Module Boutique** (catalogue produits enrichi avec stock, FAQ, mode d'emploi)
3. ⏳ **Module Clients** (vue CRM)
4. ⏳ **Module Livraisons** (livre de comptes intégré)
5. ⏳ **Module Finances** (livre de comptes consolidé + paiements à faire)
6. ⏳ **Module Paramètres** (compte global + gestion des marchés)
7. ⏳ **Tableau de bord d'accueil** (à designer EN DERNIER, dépend des autres)
8. ⏳ **Phase 4 : Setup Supabase** (12+ tables + RLS + auth)
9. ⏳ **Connecter UI à Supabase** (remplacer mocks)
10. ⏳ **Interfaces partenaires** (closeuse mobile, livreur mobile, transitaire)
11. ⏳ **Phase 5 : Lancement pilote** (3-5 vendeurs, dont fondateur)

---

## 10. Mémoire conversationnelle (mantras à garder)

- *"Kamoo n'invente pas de nouveaux comportements. Kamoo enlève les frictions des comportements existants."*
- *"Le perfectionnisme est ton risque n°1. Ship d'abord, polish après."*
- *"Ta ressource la plus rare n'est pas le code (Claude t'aide), c'est ta capacité opérationnelle."*
- *"Kamoo ne touche jamais l'argent. Kamoo est le livre de comptes partagé."*
- *"L'admin Kamoo n'intervient que sur demande explicite (>72h)."*
- *"Kamoo ne rembourse pas en cas d'arnaque, mais fait le maximum."*
- *"Le sélecteur de marché recharge tout le contexte (pas de mélange entre pays)."*
- *"1 closeuse par marché côté vendeur, multi-vendeurs côté closeuse."*

---

## 11. Comment reprendre dans une nouvelle conversation

1. Charger ce document : "Lis `docs/00-project-state.md` pour comprendre l'état du projet."
2. Lancer le dev server : `cd kamoo-app && npm run dev`
3. Demander la prochaine étape concrète : "Quelle est la prochaine vraie étape selon le plan ?"
4. Confirmer / adapter selon le contexte du moment.

**Le code est la source de vérité primaire** — ce document est le contexte stratégique.
