-- Kamoo — schéma Supabase (V2)
-- À exécuter une fois dans Supabase ▸ SQL Editor.

-- ─────────────────────────────────────────────────────────────────────
-- Tokens Shopify (OAuth) — persistance serverless des access tokens.
-- Un token par boutique. Table verrouillée par RLS : SEULE la clé
-- service_role (côté serveur, cf. src/lib/supabase/admin.ts) y accède.
-- Aucune policy n'est créée → l'anon key / les utilisateurs ne peuvent
-- ni lire ni écrire ces tokens.
--
-- Tokens offline EXPIRABLES (Shopify n'accepte plus les non-expirants) :
-- on stocke aussi le refresh_token + les expirations pour renouveler
-- automatiquement l'access token (cf. src/lib/shopify/admin-client.ts).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.shopify_tokens (
  shop                      text primary key,
  access_token              text not null,
  scope                     text,
  refresh_token             text,
  expires_at                timestamptz,
  refresh_token_expires_at  timestamptz,
  installed_at              timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Si la table existe déjà (créée avant les tokens expirables), ajoute les colonnes :
alter table public.shopify_tokens add column if not exists refresh_token            text;
alter table public.shopify_tokens add column if not exists expires_at               timestamptz;
alter table public.shopify_tokens add column if not exists refresh_token_expires_at timestamptz;

alter table public.shopify_tokens enable row level security;
-- Pas de policy volontairement : accès réservé à la clé service_role.
