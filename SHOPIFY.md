# Connexion Shopify — Kamoo

Kamoo se connecte à la boutique Shopify du vendeur, **1 boutique par marché (pays)**.

## Ce qui est automatique
- **Commandes** : chaque commande Shopify arrive dans **Closing** (statut « Nouvelle »,
  source « Shopify »), prête à être confirmée par la closeuse.
- **Clients** : la fiche client est créée/ mise à jour (canal « Boutique Shopify »).
- **Statuts** : une commande **livrée & encaissée** dans Kamoo est marquée
  **honorée & payée** sur Shopify.

## Ce qui demande une permission explicite (façon DSers)
- **Produits** : aucun produit n'est poussé au hasard. Le vendeur sélectionne ses
  produits dans le Catalogue → **« Publier sur Shopify »** → confirmation → publication.

## Mode DÉMO vs RÉEL
Tant que les clés API ne sont pas renseignées, l'app tourne en **mode démo** : la
connexion, la synchro et la publication sont simulées mais injectent de vraies
données dans Kamoo. Pour passer en **réel** :

1. Va sur https://partners.shopify.com → **Apps** → **Create app** (manuel).
2. Dans la config de l'app :
   - **App URL** : `http://localhost:3000`
   - **Allowed redirection URL(s)** : `http://localhost:3000/api/shopify/callback`
3. Copie `.env.local.example` → `.env.local` et colle :
   ```
   SHOPIFY_API_KEY=...        # « Client ID » de l'app
   SHOPIFY_API_SECRET=...     # « Client secret » — ne JAMAIS committer
   ```
4. Redémarre `npm run dev`. Le badge passe à « Mode réel (OAuth) ».
5. Paramètres → Connexions → **Connecter Shopify** → l'écran d'autorisation
   officiel de Shopify s'ouvre → **Installer**.

### Notes techniques
- Sur localhost, OAuth + appels Admin API (publication, pull commandes, fulfillment)
  fonctionnent. Les **webhooks** Shopify ne peuvent pas joindre localhost : on utilise
  le **bouton Sync** (polling). En production (URL publique), on basculera sur
  les webhooks `orders/create` + `customers/create`.
- Le token est stocké dans `.shopify-tokens.json` (gitignoré) — OK pour le dev local.
  En V2 : table chiffrée Supabase.

---

## 🚨 Dépannage : « Sync » dit *Autorisations API manquantes* (scopes vides)

**Cause** : sur une app créée dans le Partner Dashboard, les autorisations ne
viennent PAS de l'URL OAuth — elles doivent être déclarées dans la
**configuration de l'app**. Sans ça, le token obtenu n'a AUCUN droit
(symptôme exact : `ACCESS_DENIED: Access denied for orders field`).

**Réparation (2 minutes)** :
1. **partners.shopify.com** → *Apps* → ton app **Kamoo** → **Configuration**.
2. Section **Admin API integration** (ou *API access scopes*) → coche :
   `read_orders`, `write_orders`, `read_products`, `write_products`,
   `read_customers`, `write_merchant_managed_fulfillment_orders` → **Save**.
3. Section **API access → Protected customer data access** → *Request access* :
   - motif : **App functionality** ;
   - champs : **Name**, **Phone**, **Address** (nécessaires au closing COD).
   - Sur une dev store, l'accès est accordé immédiatement.
4. Dans Kamoo → *Paramètres → Connexions* → **« Mettre à jour les
   autorisations »** sur la boutique → écran Shopify → **Installer**.
5. Le badge passe à **« API opérationnelle »** → la synchro coule toute seule
   (auto-sync toutes les 60 s + bouton Sync).

## Temps réel & multi-boutiques
- **Une seule app Kamoo pour toutes les boutiques** : chaque boutique se
  connecte via le même OAuth (token par domaine). Aucun vendeur n'a besoin de
  créer une app — il saisit juste son domaine et autorise.
- **Local** : auto-sync (polling 60 s) = les commandes Shopify tombent dans
  Closing sans aucun clic. **Production** : la route `/api/shopify/webhooks`
  (HMAC vérifié) est prête — il suffira d'enregistrer `orders/create` +
  `customers/create` quand Kamoo aura une URL publique.
- **Push automatique** : commande Shopify livrée & encaissée dans Kamoo →
  marquée *honorée* sur Shopify sans intervention.
- Note pour plus tard : pour installer l'app sur une **boutique de production**
  (pas une dev store), Shopify exige de choisir une distribution (custom ou
  publique non listée) dans le Partner Dashboard — à faire au moment du lancement.
