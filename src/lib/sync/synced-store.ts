"use client";

import { useSyncExternalStore } from "react";

/**
 * Store SINGLETON synchronisé avec le mini-backend de démo
 * (/api/demo-state) — partagé entre la console vendeur (3000) et l'app
 * partenaires (3001).
 *
 * Fonctionnement :
 *  - hydratation initiale : GET (fallback : sessionStorage, puis défaut) ;
 *  - écriture : setState → notifie localement (optimiste) + POST + miroir
 *    sessionStorage (secours si l'API est down) ;
 *  - synchro entrante : poll GET toutes les ~2,5 s, ne notifie que si la
 *    version serveur a avancé.
 *
 * V2 : remplacé par Supabase realtime — l'API (get/set/subscribe) ne
 * changera pas pour les hooks consommateurs.
 */

export type SyncedStore<T> = {
  /** Hook React : s'abonne et renvoie l'état courant. */
  use: () => T;
  /** Lit l'état courant (hors React). */
  get: () => T;
  /** Écrit l'état (optimiste local + POST serveur). */
  set: (updater: (prev: T) => T) => void;
};

const API_BASE =
  process.env.NEXT_PUBLIC_DEMO_STATE_URL ?? "http://localhost:3000/api/demo-state";

const POLL_MS = 2_500;

export function createSyncedStore<T>(key: string, defaultValue: T): SyncedStore<T> {
  let state: T = defaultValue;
  let serverVersion = 0;
  let hydrated = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const FROZEN_DEFAULT = defaultValue; // référence stable pour le SSR snapshot

  function notify() {
    listeners.forEach((l) => l());
  }

  function mirrorToSession() {
    try {
      sessionStorage.setItem(`synced.${key}`, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  async function pull() {
    try {
      const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { value: T | null; v: number };
      if (data.v > serverVersion) {
        serverVersion = data.v;
        if (data.value !== null) {
          state = data.value;
          mirrorToSession();
          notify();
        }
      }
    } catch {
      /* API down — on vit sur l'état local */
    }
  }

  async function push() {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value: state }),
      });
      if (res.ok) {
        const data = (await res.json()) as { v: number };
        serverVersion = Math.max(serverVersion, data.v);
      }
    } catch {
      /* API down — le miroir sessionStorage garde l'état */
    }
  }

  function hydrateOnce() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    // Secours immédiat : le miroir sessionStorage (avant la réponse réseau)
    try {
      const mirror = sessionStorage.getItem(`synced.${key}`);
      if (mirror !== null) {
        state = JSON.parse(mirror) as T;
        notify();
      }
    } catch {
      /* ignore */
    }
    void pull();
    pollTimer = setInterval(() => void pull(), POLL_MS);
    // Le timer vit pour toute la session (store singleton) — pas de cleanup.
    void pollTimer;
  }

  function subscribe(callback: () => void): () => void {
    hydrateOnce();
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }

  const store: SyncedStore<T> = {
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => state,
        () => FROZEN_DEFAULT,
      ),
    get: () => state,
    set: (updater) => {
      state = updater(state);
      mirrorToSession();
      notify();
      void push();
    },
  };

  return store;
}
