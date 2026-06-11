import { promises as fs } from "fs";
import path from "path";

/**
 * Stockage serveur des access tokens Shopify (par domaine boutique).
 *
 * V1 dev : fichier JSON gitignoré à la racine du projet. Suffisant pour un
 * usage local mono-utilisateur. ⚠️ Ce n'est PAS sécurisé pour la production.
 * V2 : table chiffrée Supabase (clé par vendor_id + shop).
 */

const FILE = path.join(process.cwd(), ".shopify-tokens.json");

type TokenEntry = {
  accessToken: string;
  scope: string;
  installedAt: string;
};

type TokenFile = Record<string, TokenEntry>;

async function readAll(): Promise<TokenFile> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as TokenFile;
  } catch {
    return {};
  }
}

export async function saveToken(shop: string, entry: TokenEntry): Promise<void> {
  const all = await readAll();
  all[shop] = entry;
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
}

export async function getToken(shop: string): Promise<TokenEntry | null> {
  const all = await readAll();
  return all[shop] ?? null;
}

export async function deleteToken(shop: string): Promise<void> {
  const all = await readAll();
  delete all[shop];
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf8");
}
