# Kamoo Console

Console d'opérations **COD** (paiement à la livraison) pour e-commerçants
ouest-africains. Le vendeur source ses produits (souvent de Chine), les vend
(Shopify / pub), et Kamoo orchestre l'après-vente : **confirmation par appel
(closing) → livraison → encaissement du cash → règlement des partenaires**.

➡️ Logique métier détaillée : [`docs/LOGIQUE-METIER.md`](docs/LOGIQUE-METIER.md)

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (tokens dans `src/app/globals.css`)
- Données V1 : **mock côté client** (sessionStorage via stores synchronisés).
  V2 cible : **Supabase** + server actions.

## Démarrage local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
```

## Variables d'environnement (`.env.local`, non commité)

Optionnelles — sans elles, l'app tourne en **mode démo** (Shopify simulé).

| Variable | Rôle |
|---|---|
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | OAuth Admin API |
| `SHOPIFY_SCOPES` | scopes (défaut fourni dans `config.ts`) |
| `SHOPIFY_APP_URL` | URL publique (ex. `https://kamoo.me`) |

> ⚠️ En serverless (Vercel), le token store fichier (`.shopify-tokens.json`)
> n'est **pas persistant** → Shopify « réel » nécessite la V2 (tokens en base).
> Utiliser le mode démo en ligne.

## Déploiement

Hébergé sur **Vercel**. Le repo est connecté : **chaque push sur `main`
déclenche un déploiement de production** ; les autres branches génèrent des
*preview deployments*.

- Production : `kamoo.me` (DNS chez Namecheap → A `@`/`www` → `76.76.21.21`)
- Build : `next build` (statique + routes serverless)

## Architecture (repères)

- `src/app/(vendor)/…` — la console (dashboard, closing, livraisons, catalogue,
  expéditions, clients, marketplace, finances, paramètres).
- `src/app/api/shopify/…` — OAuth, sync commandes, import/publication produits.
- `src/components/…` — UI (composants Kamoo, console, finance).
- `src/lib/…` — hooks d'état, types, données mock, helpers (format, Shopify).

> V1 — pas d'authentification (console publique si déployée telle quelle) et
> mise en page **desktop-only** (`min-w 1100px`).
