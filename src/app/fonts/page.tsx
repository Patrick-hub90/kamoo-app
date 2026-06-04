"use client";

/**
 * /fonts — essayage de polices en direct sur le dashboard navy.
 * Clique une police → tout le dashboard s'y met instantanément.
 * 7 sans-serifs épurées (grotesques + géométriques), chargées via Google Fonts.
 */

import { useState } from "react";
import { DashboardPreview } from "@/components/apercu/dashboard-preview";

type Font = { key: string; stack: string; note: string; reco?: boolean };

const FONTS: Font[] = [
  { key: "Inter", stack: "'Inter', sans-serif", note: "Grotesque neutre — le standard SaaS (actuel)" },
  { key: "Manrope", stack: "'Manrope', sans-serif", note: "Géométrique premium, net — mon choix n°1", reco: true },
  { key: "Plus Jakarta Sans", stack: "'Plus Jakarta Sans', sans-serif", note: "Humaniste géométrique — pro et chaleureux" },
  { key: "DM Sans", stack: "'DM Sans', sans-serif", note: "Compact et clair — excellent en dense" },
  { key: "Poppins", stack: "'Poppins', sans-serif", note: "Géométrique rond — friendly" },
  { key: "Montserrat", stack: "'Montserrat', sans-serif", note: "Géométrique large — élégant" },
  { key: "Sora", stack: "'Sora', sans-serif", note: "Géométrique tech — du caractère" },
];

const GOOGLE_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Inter:wght@400;500;600;700;800",
    "family=Manrope:wght@400;500;600;700;800",
    "family=Plus+Jakarta+Sans:wght@400;500;600;700;800",
    "family=DM+Sans:wght@400;500;600;700",
    "family=Poppins:wght@400;500;600;700",
    "family=Montserrat:wght@400;500;600;700;800",
    "family=Sora:wght@400;500;600;700;800",
  ].join("&") +
  "&display=swap";

export default function FontsPage() {
  const [active, setActive] = useState<Font>(FONTS[1]); // Manrope par défaut

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={GOOGLE_HREF} />

      <div className="relative">
        <DashboardPreview variant="navy" fontFamily={active.stack} />

        {/* Sélecteur flottant */}
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#E1E4E9] bg-white/95 p-2.5 shadow-[0_12px_40px_rgba(16,24,40,0.18)] backdrop-blur">
            <div className="flex items-center gap-1.5">
              <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9AA1AD]">
                Police
              </span>
              {FONTS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActive(f)}
                  style={{ fontFamily: f.stack }}
                  className={[
                    "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition",
                    active.key === f.key
                      ? "bg-kamoo-blue-900 text-white"
                      : "text-ink-700 hover:bg-[#F2F4F7]",
                  ].join(" ")}
                >
                  {f.key}
                  {f.reco && active.key !== f.key && (
                    <span className="ml-1 text-[10px] text-kamoo-orange-600">★</span>
                  )}
                </button>
              ))}
            </div>
            <div className="text-[11.5px] text-[#6B7280]" style={{ fontFamily: active.stack }}>
              <span className="font-semibold text-ink-900">{active.key}</span> — {active.note}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
