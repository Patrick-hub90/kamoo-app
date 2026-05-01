"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/data/countries";
import { CountrySelector } from "./country-selector";

export function Topbar() {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);

  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-8 py-3.5">
      <div className="flex-1" />

      {/* Notifications */}
      <button className="relative rounded-lg p-2.5 text-ink-700 hover:bg-paper-2">
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-kamoo-orange-500 ring-2 ring-white" />
      </button>

      {/* Sélecteur marché */}
      <CountrySelector value={country} onChange={setCountry} />
    </header>
  );
}
