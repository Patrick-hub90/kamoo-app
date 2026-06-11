import { promises as fs } from "fs";
import path from "path";

/**
 * Mini-backend de DÉMO — état partagé entre la console vendeur (port 3000)
 * et l'app partenaires (port 3001).
 *
 * Stockage : un simple fichier JSON à la racine du projet (gitignoré).
 * Chaque clé porte un numéro de version (incrémenté à chaque écriture) pour
 * que les clients ne re-rendent que quand quelque chose a vraiment changé.
 *
 * V2 : remplacé par Supabase (tables + realtime). L'API des stores côté
 * client ne changera pas.
 */

const FILE = path.join(process.cwd(), ".demo-state.json");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
} as const;

type StateFile = {
  values: Record<string, unknown>;
  versions: Record<string, number>;
};

async function readAll(): Promise<StateFile> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StateFile>;
    return { values: parsed.values ?? {}, versions: parsed.versions ?? {} };
  } catch {
    return { values: {}, versions: {} };
  }
}

async function writeAll(state: StateFile): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(state), "utf8");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const state = await readAll();
  if (key) {
    return Response.json(
      { value: state.values[key] ?? null, v: state.versions[key] ?? 0 },
      { headers: CORS },
    );
  }
  return Response.json(state, { headers: CORS });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { key: string; value: unknown };
  if (!body?.key) {
    return Response.json({ error: "key requis" }, { status: 400, headers: CORS });
  }
  const state = await readAll();
  state.values[body.key] = body.value;
  state.versions[body.key] = (state.versions[body.key] ?? 0) + 1;
  await writeAll(state);
  return Response.json({ ok: true, v: state.versions[body.key] }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
