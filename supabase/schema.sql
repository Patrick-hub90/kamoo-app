-- Kamoo — schéma Supabase (V2)
-- À exécuter une fois dans Supabase ▸ SQL Editor.

-- ─────────────────────────────────────────────────────────────────────
-- Tokens Shopify (OAuth) — persistance serverless des access tokens.
-- Un token par boutique. Table verrouillée par RLS : SEULE la clé
-- service_role (côté serveur, cf. src/lib/supabase/admin.ts) y accède.
-- Aucune policy n'est créée → l'anon key / les utilisateurs ne peuvent
-- ni lire ni écrire ces tokens.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.shopify_tokens (
  shop          text primary key,
  access_token  text not null,
  scope         text,
  installed_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.shopify_tokens enable row level security;
-- Pas de policy volontairement : accès réservé à la clé service_role.
