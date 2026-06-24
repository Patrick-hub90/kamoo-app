import { cn } from "@/lib/utils";

/**
 * Langage de CHARGEMENT Kamoo — à utiliser quand un écran ou une donnée tarde.
 *
 * Trois niveaux :
 *  - `Skeleton`            : brique de base (balayage clair sur fond paper-2).
 *  - `KamooSpinner`        : indicateur compact (boutons, lignes, zones).
 *  - `KamooBrandLoader`    : écran plein de marque (boot de l'app, transitions).
 *  - `ConsolePageSkeleton` : gabarit d'attente calqué sur la coque console
 *                            (en-tête + actions + KPI + tableau/liste).
 *
 * Sobre par choix : un seul reflet animé, pas d'ombres ni de couleurs criardes.
 * Respecte `prefers-reduced-motion` (cf. globals.css).
 */

/* ─── Marque ──────────────────────────────────────────────────────── */

export function KamooMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0F2A52" />
      <path
        d="M13 10 L13 30 M13 20 L23 10 M13 20 L23 30"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="13" r="3.5" fill="#F97316" />
    </svg>
  );
}

/* ─── Brique squelette ────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("kamoo-skeleton rounded-lg", className)} />;
}

/* ─── Spinner compact ─────────────────────────────────────────────── */

export function KamooSpinner({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        "inline-block animate-spin rounded-full border-[2.5px] border-paper-2 border-t-kamoo-blue-900 align-[-2px]",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

/* ─── Écran plein de marque ───────────────────────────────────────── */

export function KamooBrandLoader({
  label = "Chargement…",
  fullScreen = true,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "grid place-items-center bg-paper",
        fullScreen ? "min-h-screen" : "min-h-[60vh]",
      )}
    >
      <div className="flex flex-col items-center">
        <div className="kamoo-breathe flex items-center gap-2.5">
          <KamooMark size={36} />
          <span className="text-[18px] font-medium tracking-tight text-ink-900">
            Kamoo<span className="text-kamoo-orange-500">.</span>
          </span>
        </div>
        {/* Liseré de progression indéterminé */}
        <div className="kamoo-progress-track mt-5 h-[3px] w-32 overflow-hidden rounded-full bg-paper-2" />
        <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-400">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Gabarit d'attente de page console ───────────────────────────── */

function HeaderSkeleton() {
  return (
    <div className="flex min-h-[60px] items-center justify-between border-b border-line bg-paper px-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function ConsolePageSkeleton({
  variant = "table",
  rows = 7,
  showKpi = true,
}: {
  variant?: "table" | "list";
  rows?: number;
  showKpi?: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full flex-col bg-paper"
    >
      <span className="sr-only">Chargement de la page…</span>
      <HeaderSkeleton />

      <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-4 px-6 py-6">
        {/* Ligne d'actions (boutons à droite) */}
        <div className="flex items-center justify-end gap-2.5">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>

        {/* Bande KPI */}
        {showKpi && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-line bg-white px-4 py-3 shadow-kamoo-sm"
              >
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Barre de filtres */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-36" />
          </div>
        </div>

        {/* Contenu : tableau ou liste de cartes */}
        {variant === "table" ? (
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-kamoo-sm">
            <div className="flex items-center gap-4 border-b border-line px-4 py-3">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="ml-auto h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0"
              >
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="ml-auto h-3 w-14" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-kamoo-sm"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-5/6" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
