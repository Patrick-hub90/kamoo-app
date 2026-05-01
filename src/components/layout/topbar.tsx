"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/data/countries";
import { CountrySelector } from "./country-selector";

export function Topbar() {
  // TODO : déplacer dans un context global quand on aura plus d'écrans qui en dépendent
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);

  return (
    <header className="flex items-center gap-4 border-b border-line bg-white px-8 py-3.5">
      {/* Sélecteur pays */}
      <CountrySelector value={country} onChange={setCountry} />

      <div className="flex-1" />

      {/* Recherche */}
      <div className="flex w-72 items-center gap-2 rounded-full border border-line bg-paper-2 px-4 py-2">
        <Search className="h-3.5 w-3.5 text-ink-400" />
        <input
          type="search"
          placeholder="Rechercher…"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-400"
        />
      </div>

      {/* Notifications */}
      <button className="relative rounded-lg p-2.5 text-ink-700 hover:bg-paper-2">
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-kamoo-orange-500 ring-2 ring-white" />
      </button>
    </header>
  );
}
