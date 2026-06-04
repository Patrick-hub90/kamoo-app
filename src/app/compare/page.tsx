"use client";

/**
 * /compare — voir les deux variantes d'identité côte à côte, à l'échelle.
 * Chaque colonne est un iframe de la page réelle (1500px logique) réduit à
 * 45% pour tenir à deux dans la fenêtre. « Ouvrir en grand » = page pleine.
 */

const LOGICAL_W = 1500;
const LOGICAL_H = 1320;
const SCALE = 0.45;

function Column({ label, href, accent }: { label: string; href: string; accent: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-900">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
          {label}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] font-medium text-[#6B7280] transition hover:text-ink-900"
        >
          Ouvrir en grand ↗
        </a>
      </div>
      <div
        className="relative overflow-hidden rounded-2xl border border-[#E1E4E9] bg-white shadow-[0_6px_24px_rgba(16,24,40,0.10)]"
        style={{ width: LOGICAL_W * SCALE, height: LOGICAL_H * SCALE }}
      >
        <iframe
          src={href}
          title={label}
          style={{
            width: LOGICAL_W,
            height: LOGICAL_H,
            border: 0,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen w-full bg-[#EEF0F3] [font-family:var(--font-inter)]">
      <div className="mx-auto max-w-[1480px] px-6 py-7">
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9AA1AD]">
            Prototype d'identité · comparaison
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-900">
            Sidebar Navy vs Sidebar Orange
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Même contenu, même densité — seul le shell de marque change. Survole pour comparer le ressenti.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <Column label="Sidebar Navy" href="/apercu" accent="#0F2A52" />
          <Column label="Sidebar Orange" href="/apercu-orange" accent="#EA580C" />
        </div>
      </div>
    </div>
  );
}
