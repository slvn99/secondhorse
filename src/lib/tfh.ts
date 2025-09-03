"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Horse } from "@/lib/horses";

// Storage keys and custom events
export const TFH_STORAGE = {
  MATCHES: "tfh_matches",
  GENDER: "tfh_gender",
  MIN_AGE: "tfh_minAge",
  MAX_AGE: "tfh_maxAge",
  INDEX: "tfh_index",
  SEED: "tfh_seed",
} as const;

export const TFH_EVENTS = {
  MATCHES: "tfh:matches",
  OPEN_FILTERS: "tfh:open-filters",
  OPEN_PROFILE: "tfh:open-profile",
  RESET: "tfh:reset",
} as const;

function dispatch(name: string, detail?: any) {
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
}

type MatchEntry = { name: string; snap?: Partial<Horse> };

export function useTfhMatches(baseList: Horse[]) {
  // CENTRAL SOURCE OF TRUTH: liked entries with optional snapshot for rendering
  const [liked, setLiked] = useState<MatchEntry[]>([]);

  const byName = useMemo(() => new Map(baseList.map((h) => [h.name, h] as const)), [baseList]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(TFH_STORAGE.MATCHES);
      if (!raw) { setLiked([]); return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { setLiked([]); return; }
      // Back-compat: entries may be objects {name} or strings (rare) or richer objects with snap
      const entries: MatchEntry[] = parsed
        .map((x: any) => {
          if (!x) return null;
          if (typeof x === "string") return { name: x } as MatchEntry;
          if (typeof x.name === "string") return { name: x.name, snap: x.snap || undefined } as MatchEntry;
          return null;
        })
        .filter(Boolean) as MatchEntry[];
      const seen = new Set<string>();
      const deduped = entries.filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)));
      setLiked(deduped);
    } catch { setLiked([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === TFH_STORAGE.MATCHES) load(); };
    const onCustom = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener(TFH_EVENTS.MATCHES, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TFH_EVENTS.MATCHES, onCustom as EventListener);
    };
  }, [load]);

  const persist = useCallback((entries: MatchEntry[]) => {
    try {
      if (entries.length) {
        localStorage.setItem(TFH_STORAGE.MATCHES, JSON.stringify(entries));
      } else {
        localStorage.removeItem(TFH_STORAGE.MATCHES);
      }
      setTimeout(() => dispatch(TFH_EVENTS.MATCHES), 0);
    } catch {}
  }, []);

  const addMatch = useCallback((h: Horse) => {
    setLiked((prev) => {
      if (prev.find((e) => e.name === h.name)) return prev;
      const snap: Partial<Horse> = {
        image: h.image,
        age: h.age,
        gender: h.gender,
        heightCm: h.heightCm,
        breed: h.breed,
        location: h.location,
        description: h.description,
        color: (h as any).color,
        temperament: (h as any).temperament,
        interests: Array.isArray(h.interests) ? h.interests : undefined,
        disciplines: Array.isArray(h.disciplines) ? h.disciplines : undefined,
        photos: Array.isArray(h.photos) ? h.photos : undefined,
      };
      const next = [...prev, { name: h.name, snap }];
      persist(next);
      return next;
    });
  }, [persist]);

  const clearMatches = useCallback(() => { setLiked([]); persist([]); }, [persist]);
  const removeMatch = useCallback((name: string) => {
    setLiked((prev) => {
      const next = prev.filter((e) => e.name !== name);
      persist(next);
      return next;
    });
  }, [persist]);

  // DERIVED: actual matches using central chance logic
  const matches = useMemo(() => {
    const res: Horse[] = [];
    for (const entry of liked) {
      const n = entry.name;
      if (!shouldMatchFor(n)) continue;
      const h = byName.get(n);
      if (h) { res.push(h); continue; }
      // Build from snapshot if available
      const s = entry.snap || {};
      res.push({
        name: n,
        age: typeof s.age === "number" ? s.age : 0,
        breed: (s as any).breed || "",
        location: (s as any).location || "",
        gender: (s as any).gender || "Gelding",
        heightCm: typeof (s as any).heightCm === "number" ? (s as any).heightCm : 0,
        color: (s as any).color || "",
        temperament: (s as any).temperament || "",
        disciplines: Array.isArray((s as any).disciplines) ? (s as any).disciplines as string[] : [],
        description: (s as any).description || "",
        interests: Array.isArray((s as any).interests) ? (s as any).interests as string[] : [],
        image: (s as any).image || "/TFH/Tinder-for-Horses-cover-image.png",
        photos: Array.isArray((s as any).photos) ? (s as any).photos as string[] : undefined,
      });
    }
    return res;
  }, [liked, byName]);

  // Enrich existing entries with missing snapshot details (interests/discipline/etc.)
  useEffect(() => {
    let changed = false;
    const next: MatchEntry[] = liked.map((e) => {
      const s = e.snap || {};
      const missingInterests = !Array.isArray((s as any).interests);
      const missingDisciplines = !Array.isArray((s as any).disciplines);
      const missingColor = !(s as any).color;
      const missingTemperament = !(s as any).temperament;
      const missingImage = !(s as any).image;
      const missingDesc = !(s as any).description;
      if (missingInterests || missingDisciplines || missingColor || missingTemperament || missingImage || missingDesc) {
        const h = byName.get(e.name);
        if (h) {
          const snap: Partial<Horse> = {
            ...s,
            image: (s as any).image || h.image,
            description: (s as any).description || h.description,
            color: (s as any).color || (h as any).color,
            temperament: (s as any).temperament || (h as any).temperament,
            interests: Array.isArray((s as any).interests) ? (s as any).interests : (Array.isArray(h.interests) ? h.interests : undefined),
            disciplines: Array.isArray((s as any).disciplines) ? (s as any).disciplines : (Array.isArray(h.disciplines) ? h.disciplines : undefined),
          };
          changed = true;
          return { name: e.name, snap };
        }
      }
      return e;
    });
    if (changed) { setLiked(next); persist(next); }
  }, [liked, byName, persist]);

  return { matches, addMatch, removeMatch, clearMatches } as const;
}

// Deterministic match chance based on user seed and horse name
// Deterministic hashing / RNG helpers (exported for reuse)
export function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
export function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scoreForName(name: string, seed: string): number {
  const sfn = xmur3(`${seed}|${name}`);
  const rnd = mulberry32(sfn());
  return rnd();
}

// Stable ID derivation for local entries (FNV‑1a 32‑bit)
export function stableIdForName(name: string): string {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = (h ^ name.charCodeAt(i)) * 16777619;
  return (h >>> 0).toString(16);
}

export function shouldMatchFor(name: string, threshold = 0.6): boolean {
  let seed = "default";
  try {
    let s = localStorage.getItem(TFH_STORAGE.SEED);
    if (!s) {
      s = Math.random().toString(36).slice(2);
      localStorage.setItem(TFH_STORAGE.SEED, s);
    }
    seed = s || seed;
  } catch {}
  return scoreForName(name, seed) > threshold;
}

export type GenderFilter = "All" | "Mare" | "Stallion" | "Gelding";

export function useTfhFilters() {
  const [gender, setGender] = useState<GenderFilter>("All");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");

  // Load once
  useEffect(() => {
    try {
      const g = localStorage.getItem(TFH_STORAGE.GENDER);
      const min = localStorage.getItem(TFH_STORAGE.MIN_AGE);
      const max = localStorage.getItem(TFH_STORAGE.MAX_AGE);
      if (g === "Mare" || g === "Stallion" || g === "Gelding" || g === "All") setGender(g);
      if (min !== null && min !== "") setMinAge(Number(min));
      if (max !== null && max !== "") setMaxAge(Number(max));
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(TFH_STORAGE.GENDER, gender);
      localStorage.setItem(TFH_STORAGE.MIN_AGE, minAge === "" ? "" : String(minAge));
      localStorage.setItem(TFH_STORAGE.MAX_AGE, maxAge === "" ? "" : String(maxAge));
    } catch {}
  }, [gender, minAge, maxAge]);

  const clearFilters = useCallback(() => {
    setGender("All"); setMinAge(""); setMaxAge("");
    try {
      localStorage.removeItem(TFH_STORAGE.GENDER);
      localStorage.removeItem(TFH_STORAGE.MIN_AGE);
      localStorage.removeItem(TFH_STORAGE.MAX_AGE);
    } catch {}
  }, []);

  return { gender, setGender, minAge, setMinAge, maxAge, setMaxAge, clearFilters } as const;
}

export function useDeckIndex(max: number) {
  const [index, setIndex] = useState(0);
  // Load
  useEffect(() => {
    try {
      const idx = localStorage.getItem(TFH_STORAGE.INDEX);
      if (idx !== null && !Number.isNaN(Number(idx))) setIndex(Number(idx));
    } catch {}
  }, []);
  // Persist
  useEffect(() => {
    try { localStorage.setItem(TFH_STORAGE.INDEX, String(index)); } catch {}
  }, [index]);
  // Clamp: allow one-past-the-end (deck.length) so UI can show "No more"
  useEffect(() => {
    const allowedMax = Math.max(0, max + 1);
    if (index > allowedMax) setIndex(allowedMax);
  }, [index, max]);
  return [index, setIndex] as const;
}

export function useSeed() {
  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => {
    try {
      let s = localStorage.getItem(TFH_STORAGE.SEED);
      if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem(TFH_STORAGE.SEED, s); }
      setSeed(s);
    } catch { setSeed("default"); }
  }, []);
  useEffect(() => {
    const onReset = () => {
      const s = Math.random().toString(36).slice(2);
      try { localStorage.setItem(TFH_STORAGE.SEED, s); } catch {}
      setSeed(s);
    };
    window.addEventListener(TFH_EVENTS.RESET, onReset as EventListener);
    return () => window.removeEventListener(TFH_EVENTS.RESET, onReset as EventListener);
  }, []);
  return seed;
}

