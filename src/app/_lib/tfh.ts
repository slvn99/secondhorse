"use client";

import { useCallback, useEffect, useState } from "react";
import type { Horse } from "./horses";

export const TFH_STORAGE = { MATCHES: "tfh_matches", GENDER: "tfh_gender", MIN_AGE: "tfh_minAge", MAX_AGE: "tfh_maxAge", INDEX: "tfh_index", SEED: "tfh_seed" } as const;
export const TFH_EVENTS = { MATCHES: "tfh:matches", OPEN_FILTERS: "tfh:open-filters", OPEN_PROFILE: "tfh:open-profile", RESET: "tfh:reset" } as const;

function dispatch(name: string, detail?: any) { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} }

export function useTfhMatches(baseList: Horse[]) {
  const [matches, setMatches] = useState<Horse[]>([]);
  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(TFH_STORAGE.MATCHES);
      if (!raw) { setMatches([]); return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { setMatches([]); return; }
      const byName = new Map(baseList.map((h) => [h.name, h] as const));
      const restored = parsed.map((h: any) => (h && typeof h.name === "string" ? byName.get(h.name) || null : null)).filter(Boolean) as Horse[];
      const seen = new Set<string>();
      const deduped = restored.filter((h) => (seen.has(h.name) ? false : (seen.add(h.name), true)));
      setMatches(deduped);
    } catch { setMatches([]); }
  }, [baseList]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === TFH_STORAGE.MATCHES) load(); };
    const onCustom = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener(TFH_EVENTS.MATCHES, onCustom as EventListener);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(TFH_EVENTS.MATCHES, onCustom as EventListener); };
  }, [load]);

  const persist = useCallback((list: Horse[]) => {
    try { if (list.length) localStorage.setItem(TFH_STORAGE.MATCHES, JSON.stringify(list.map((h) => ({ name: h.name })))); else localStorage.removeItem(TFH_STORAGE.MATCHES); dispatch(TFH_EVENTS.MATCHES); } catch {}
  }, []);

  const addMatch = useCallback((h: Horse) => { setMatches((prev) => { if (prev.find((x) => x.name === h.name)) return prev; const next = [...prev, h]; persist(next); return next; }); }, [persist]);
  const clearMatches = useCallback(() => { setMatches([]); persist([]); }, [persist]);
  return { matches, setMatches, addMatch, clearMatches } as const;
}

export type GenderFilter = "All" | "Mare" | "Stallion" | "Gelding";

export function useTfhFilters() {
  const [gender, setGender] = useState<GenderFilter>("All");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  useEffect(() => { try { const g = localStorage.getItem(TFH_STORAGE.GENDER); const min = localStorage.getItem(TFH_STORAGE.MIN_AGE); const max = localStorage.getItem(TFH_STORAGE.MAX_AGE); if (g === "Mare" || g === "Stallion" || g === "Gelding" || g === "All") setGender(g); if (min !== null && min !== "") setMinAge(Number(min)); if (max !== null && max !== "") setMaxAge(Number(max)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(TFH_STORAGE.GENDER, gender); localStorage.setItem(TFH_STORAGE.MIN_AGE, minAge === "" ? "" : String(minAge)); localStorage.setItem(TFH_STORAGE.MAX_AGE, maxAge === "" ? "" : String(maxAge)); } catch {} }, [gender, minAge, maxAge]);
  const clearFilters = useCallback(() => { setGender("All"); setMinAge(""); setMaxAge(""); try { localStorage.removeItem(TFH_STORAGE.GENDER); localStorage.removeItem(TFH_STORAGE.MIN_AGE); localStorage.removeItem(TFH_STORAGE.MAX_AGE); } catch {} }, []);
  return { gender, setGender, minAge, setMinAge, maxAge, setMaxAge, clearFilters } as const;
}

export function useDeckIndex(max: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => { try { const idx = localStorage.getItem(TFH_STORAGE.INDEX); if (idx !== null && !Number.isNaN(Number(idx))) setIndex(Number(idx)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(TFH_STORAGE.INDEX, String(index)); } catch {} }, [index]);
  useEffect(() => { if (index > max) setIndex(max); }, [index, max]);
  return [index, setIndex] as const;
}

export function useSeed() {
  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => { try { let s = localStorage.getItem(TFH_STORAGE.SEED); if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem(TFH_STORAGE.SEED, s); } setSeed(s); } catch { setSeed("default"); } }, []);
  useEffect(() => { const onReset = () => { const s = Math.random().toString(36).slice(2); try { localStorage.setItem(TFH_STORAGE.SEED, s); } catch {} setSeed(s); }; window.addEventListener(TFH_EVENTS.RESET, onReset as EventListener); return () => window.removeEventListener(TFH_EVENTS.RESET, onReset as EventListener); }, []);
  return seed;
}

