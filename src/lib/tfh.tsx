"use client";
// TFH provider and hooks (JSX requires .tsx)

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Horse } from "@/lib/horses";

export const TFH_STORAGE = {
  MATCHES: "tfh_matches",
  GENDER: "tfh_gender",
  MIN_AGE: "tfh_minAge",
  MAX_AGE: "tfh_maxAge",
  INDEX: "tfh_index",
  SEED: "tfh_seed",
} as const;

type MatchEntry = { name: string; snap?: Partial<Horse> };

export type GenderFilter = "All" | "Mare" | "Stallion" | "Gelding";

type MatchesContextValue = {
  liked: MatchEntry[];
  addMatch: (horse: Horse) => void;
  removeMatch: (name: string) => void;
  clearMatches: () => void;
  setLiked: React.Dispatch<React.SetStateAction<MatchEntry[]>>;
};

type FiltersContextValue = {
  gender: GenderFilter;
  setGender: (value: GenderFilter) => void;
  minAge: number | "";
  setMinAge: (value: number | "") => void;
  maxAge: number | "";
  setMaxAge: (value: number | "") => void;
  clearFilters: () => void;
};

type UiContextValue = {
  filtersOpen: boolean;
  openFilters: () => void;
  closeFilters: () => void;
  toggleFilters: () => void;
  resetApp: () => void;
  resetCounter: number;
  overlayActive: boolean;
  pushOverlay: () => void;
  popOverlay: () => void;
  projectInfoOpen: boolean;
  setProjectInfoOpen: (open: boolean) => void;
  toggleProjectInfo: () => void;
};

type SeedContextValue = {
  ensureSeed: () => string;
  regenerateSeed: () => string;
  seedRevision: number;
};

type TfhContextValue = {
  matches: MatchesContextValue;
  filters: FiltersContextValue;
  ui: UiContextValue;
  seed: SeedContextValue;
};

const DEFAULT_FILTERS: { gender: GenderFilter; minAge: number | ""; maxAge: number | "" } = {
  gender: "All",
  minAge: "",
  maxAge: "",
};

const DEFAULT_SEED = "default";

const TfhContext = createContext<TfhContextValue | null>(null);

function createSeed() {
  return Math.random().toString(36).slice(2);
}

function readMatchesFromStorage(): MatchEntry[] {
  try {
    const raw = localStorage.getItem(TFH_STORAGE.MATCHES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: MatchEntry[] = parsed
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === "string") return { name: item };
        if (typeof item.name === "string") {
          return {
            name: item.name,
            snap: item.snap || undefined,
          } satisfies MatchEntry;
        }
        return null;
      })
      .filter(Boolean) as MatchEntry[];
    const seen = new Set<string>();
    return entries.filter((entry) => (seen.has(entry.name) ? false : (seen.add(entry.name), true)));
  } catch {
    return [];
  }
}

function persistMatches(entries: MatchEntry[]) {
  try {
    if (entries.length) {
      localStorage.setItem(TFH_STORAGE.MATCHES, JSON.stringify(entries));
    } else {
      localStorage.removeItem(TFH_STORAGE.MATCHES);
    }
  } catch {}
}

function snapshotFromHorse(horse: Horse): Partial<Horse> {
  return {
    image: horse.image,
    age: horse.age,
    gender: horse.gender,
    heightCm: horse.heightCm,
    breed: horse.breed,
    location: horse.location,
    description: horse.description,
    color: (horse as any).color,
    temperament: (horse as any).temperament,
    interests: Array.isArray(horse.interests) ? horse.interests : undefined,
    disciplines: Array.isArray(horse.disciplines) ? horse.disciplines : undefined,
    photos: Array.isArray(horse.photos) ? horse.photos : undefined,
  } satisfies Partial<Horse>;
}

function readFiltersFromStorage() {
  const next = { ...DEFAULT_FILTERS };
  try {
    const g = localStorage.getItem(TFH_STORAGE.GENDER);
    const min = localStorage.getItem(TFH_STORAGE.MIN_AGE);
    const max = localStorage.getItem(TFH_STORAGE.MAX_AGE);
    if (g === "Mare" || g === "Stallion" || g === "Gelding" || g === "All") {
      next.gender = g;
    }
    if (min !== null && min !== "") {
      const v = Number(min);
      if (!Number.isNaN(v)) next.minAge = v;
    }
    if (max !== null && max !== "") {
      const v = Number(max);
      if (!Number.isNaN(v)) next.maxAge = v;
    }
  } catch {}
  return next;
}

function persistFilters(state: { gender: GenderFilter; minAge: number | ""; maxAge: number | "" }) {
  try {
    localStorage.setItem(TFH_STORAGE.GENDER, state.gender);
    localStorage.setItem(TFH_STORAGE.MIN_AGE, state.minAge === "" ? "" : String(state.minAge));
    localStorage.setItem(TFH_STORAGE.MAX_AGE, state.maxAge === "" ? "" : String(state.maxAge));
  } catch {}
}

function readSeedFromStorage(): string {
  try {
    const raw = localStorage.getItem(TFH_STORAGE.SEED);
    return raw || DEFAULT_SEED;
  } catch {
    return DEFAULT_SEED;
  }
}

export function TfhProvider({ children }: { children: React.ReactNode }) {
  const [liked, setLiked] = useState<MatchEntry[]>(() => readMatchesFromStorage());
  const [filtersState, setFiltersState] = useState(() => readFiltersFromStorage());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overlayCount, setOverlayCount] = useState(0);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [seedRevision, setSeedRevision] = useState(0);
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    persistMatches(liked);
  }, [liked]);

  useEffect(() => {
    if (!hydrated.current) return;
    persistFilters(filtersState);
  }, [filtersState]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === TFH_STORAGE.MATCHES) {
        setLiked(readMatchesFromStorage());
      }
      if (
        event.key === TFH_STORAGE.GENDER ||
        event.key === TFH_STORAGE.MIN_AGE ||
        event.key === TFH_STORAGE.MAX_AGE
      ) {
        setFiltersState(readFiltersFromStorage());
      }
      if (event.key === TFH_STORAGE.SEED) {
        setSeedRevision((rev) => rev + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addMatch = useCallback((horse: Horse) => {
    setLiked((prev) => {
      if (prev.some((entry) => entry.name === horse.name)) return prev;
      const next = [...prev, { name: horse.name, snap: snapshotFromHorse(horse) }];
      return next;
    });
  }, []);

  const removeMatch = useCallback((name: string) => {
    setLiked((prev) => prev.filter((entry) => entry.name !== name));
  }, []);

  const clearMatches = useCallback(() => {
    setLiked([]);
  }, []);

  const setGender = useCallback((value: GenderFilter) => {
    setFiltersState((prev) => ({ ...prev, gender: value }));
  }, []);

  const setMinAge = useCallback((value: number | "") => {
    setFiltersState((prev) => ({ ...prev, minAge: value }));
  }, []);

  const setMaxAge = useCallback((value: number | "") => {
    setFiltersState((prev) => ({ ...prev, maxAge: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const pushOverlay = useCallback(() => {
    setOverlayCount((count) => count + 1);
  }, []);

  const popOverlay = useCallback(() => {
    setOverlayCount((count) => (count > 0 ? count - 1 : 0));
  }, []);

  const regenerateSeed = useCallback(() => {
    const seed = createSeed();
    try {
      localStorage.setItem(TFH_STORAGE.SEED, seed);
    } catch {}
    setSeedRevision((rev) => rev + 1);
    return seed;
  }, []);

  const ensureSeed = useCallback(() => {
    try {
      let seed = localStorage.getItem(TFH_STORAGE.SEED);
      if (!seed) {
        seed = regenerateSeed();
      }
      return seed;
    } catch {
      return DEFAULT_SEED;
    }
  }, [regenerateSeed]);

  const resetApp = useCallback(() => {
    setLiked([]);
    setFiltersState(DEFAULT_FILTERS);
    setFiltersOpen(false);
    try { localStorage.removeItem(TFH_STORAGE.MATCHES); } catch {}
    try { localStorage.setItem(TFH_STORAGE.INDEX, "0"); } catch {}
    try { localStorage.removeItem("tfh_last_action"); } catch {}
    regenerateSeed();
    setResetCounter((count) => count + 1);
  }, [regenerateSeed]);

  const matchesValue = useMemo<MatchesContextValue>(
    () => ({ liked, addMatch, removeMatch, clearMatches, setLiked }),
    [liked, addMatch, removeMatch, clearMatches]
  );

  const filtersValue = useMemo<FiltersContextValue>(
    () => ({
      gender: filtersState.gender,
      setGender,
      minAge: filtersState.minAge,
      setMinAge,
      maxAge: filtersState.maxAge,
      setMaxAge,
      clearFilters,
    }),
    [filtersState, setGender, setMinAge, setMaxAge, clearFilters]
  );

  const uiValue = useMemo<UiContextValue>(
    () => ({
      filtersOpen,
      openFilters: () => setFiltersOpen(true),
      closeFilters: () => setFiltersOpen(false),
      toggleFilters: () => setFiltersOpen((open) => !open),
      resetApp,
      resetCounter,
      overlayActive: overlayCount > 0,
      pushOverlay,
      popOverlay,
      projectInfoOpen,
      setProjectInfoOpen,
      toggleProjectInfo: () => setProjectInfoOpen((open) => !open),
    }),
    [filtersOpen, resetApp, resetCounter, overlayCount, pushOverlay, popOverlay, projectInfoOpen]
  );

  const seedValue = useMemo<SeedContextValue>(
    () => ({ ensureSeed, regenerateSeed, seedRevision }),
    [ensureSeed, regenerateSeed, seedRevision]
  );

  const contextValue = useMemo<TfhContextValue>(
    () => ({ matches: matchesValue, filters: filtersValue, ui: uiValue, seed: seedValue }),
    [matchesValue, filtersValue, uiValue, seedValue]
  );

  return <TfhContext.Provider value={contextValue}>{children}</TfhContext.Provider>;
}

function useTfhContext() {
  const ctx = useContext(TfhContext);
  if (!ctx) {
    throw new Error("TfhProvider is required to use TFH hooks");
  }
  return ctx;
}

export function useTfhMatches(baseList: Horse[]) {
  const {
    matches: { liked, addMatch, removeMatch, clearMatches, setLiked },
  } = useTfhContext();

  const byName = useMemo(() => new Map(baseList.map((horse) => [horse.name, horse] as const)), [baseList]);

  useEffect(() => {
    setLiked((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const horse = byName.get(entry.name);
        if (!horse) return entry;
        const snap = entry.snap || {};
        let entryChanged = false;
        const updated: Partial<Horse> = { ...snap };

        const assign = <K extends keyof Partial<Horse>>(key: K, value: Partial<Horse>[K]) => {
          const current = (snap as any)[key];
          const isArray = Array.isArray(value);
          const hasValue =
            current !== undefined &&
            current !== null &&
            (!Array.isArray(current) || current.length > 0);
          if (!hasValue && value !== undefined && value !== null && (!isArray || (Array.isArray(value) && value.length > 0))) {
            (updated as any)[key] = value;
            entryChanged = true;
          }
        };

        assign("image", horse.image);
        assign("description", horse.description);
        assign("color", (horse as any).color);
        assign("temperament", (horse as any).temperament);
        assign("interests", Array.isArray(horse.interests) ? horse.interests : undefined);
        assign("disciplines", Array.isArray(horse.disciplines) ? horse.disciplines : undefined);

        if (entryChanged) {
          changed = true;
          return { name: entry.name, snap: updated };
        }
        return entry;
      });
      return changed ? next : prev;
    });
  }, [byName, setLiked]);

  const matches = useMemo(() => {
    const result: Horse[] = [];
    for (const entry of liked) {
      const horse = byName.get(entry.name);
      if (horse) {
        result.push(horse);
        continue;
      }
      const snap = entry.snap || {};
      result.push({
        name: entry.name,
        age: typeof snap.age === "number" ? snap.age : 0,
        breed: (snap as any).breed || "",
        location: (snap as any).location || "",
        gender: (snap as any).gender || "Gelding",
        heightCm: typeof (snap as any).heightCm === "number" ? (snap as any).heightCm : 0,
        color: (snap as any).color || "",
        temperament: (snap as any).temperament || "",
        disciplines: Array.isArray((snap as any).disciplines) ? ((snap as any).disciplines as string[]) : [],
        description: (snap as any).description || "",
        interests: Array.isArray((snap as any).interests) ? ((snap as any).interests as string[]) : [],
        image: (snap as any).image || "/TFH/Tinder-for-Horses-cover-image.png",
        photos: Array.isArray((snap as any).photos) ? ((snap as any).photos as string[]) : undefined,
      });
    }
    return result;
  }, [liked, byName]);

  return { matches, addMatch, removeMatch, clearMatches } as const;
}

export function useTfhFilters() {
  return useTfhContext().filters;
}

export function useTfhUI() {
  return useTfhContext().ui;
}

export function useDeckIndex(max: number) {
  const {
    ui: { resetCounter },
  } = useTfhContext();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TFH_STORAGE.INDEX);
      if (stored !== null && !Number.isNaN(Number(stored))) {
        setIndex(Number(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TFH_STORAGE.INDEX, String(index));
    } catch {}
  }, [index]);

  useEffect(() => {
    const allowedMax = Math.max(0, max + 1);
    if (index > allowedMax) {
      setIndex(allowedMax);
    }
  }, [index, max]);

  useEffect(() => {
    if (resetCounter === 0) return;
    setIndex(0);
  }, [resetCounter]);

  return [index, setIndex] as const;
}

export function useSeed(): [string | null, () => string] {
  const { seed } = useTfhContext();
  const { ensureSeed, regenerateSeed, seedRevision } = seed;
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(ensureSeed());
  }, [ensureSeed, seedRevision]);

  const regenerate = useCallback(() => regenerateSeed(), [regenerateSeed]);

  return [value, regenerate];
}

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

function currentSeed(): string {
  const seed = readSeedFromStorage();
  if (seed === DEFAULT_SEED) {
    try {
      let stored = localStorage.getItem(TFH_STORAGE.SEED);
      if (!stored) {
        stored = createSeed();
        localStorage.setItem(TFH_STORAGE.SEED, stored);
      }
      return stored;
    } catch {
      return DEFAULT_SEED;
    }
  }
  return seed;
}

export function shouldMatchFor(name: string, threshold = 0.6): boolean {
  if (threshold <= 0) return true;
  if (threshold > 1) return false;
  const seed = currentSeed();
  return scoreForName(name, seed) > threshold;
}

// Stable ID derivation for local entries (FNV-1a 32-bit)
export function stableIdForName(name: string): string {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h = (h ^ name.charCodeAt(i)) * 16777619;
  }
  return (h >>> 0).toString(16);
}
