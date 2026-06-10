import { create } from "zustand";
import type { TabId } from "@/lib/types";
import {
  buildEmptySlots,
  FIRST_PICK_STEP_INDEX,
  TOTAL_STEPS,
  isBanStep,
  type DraftSlot,
} from "@/lib/draft";
import { DEFAULT_MODE, DEFAULT_RANK, type RankFilter, type StatsMode } from "@/lib/ranks";

interface DraftStore {
  activeTab: TabId;
  setTab: (tab: TabId) => void;

  statsMode: StatsMode;
  statsRank: RankFilter;
  setStatsMode: (mode: StatsMode) => void;
  setStatsRank: (rank: RankFilter) => void;

  // Counter tab
  enemyPicks: string[];
  addEnemyPick: (id: string) => void;
  removeEnemyPick: (id: string) => void;

  // WinRate tab
  myTeam: string[];
  enemyTeam: string[];
  addToMyTeam: (id: string) => void;
  removeFromMyTeam: (id: string) => void;
  addToEnemyTeam: (id: string) => void;
  removeFromEnemyTeam: (id: string) => void;

  // Compare tab
  compareA: string | null;
  compareB: string | null;
  setCompareA: (id: string | null) => void;
  setCompareB: (id: string | null) => void;

  // Draft Sim tab
  simSlots: DraftSlot[];
  simStep: number;
  simPickHero: (heroId: string) => void;
  simClearSlot: (stepIndex: number) => void;
  simSkipBan: () => void;
  simSkipToPicks: () => void;
  simUndo: () => void;
  simReset: () => void;

  clearAll: () => void;
}

export const useDraftStore = create<DraftStore>((set) => ({
  activeTab: "draftsim",
  setTab: (tab) => set({ activeTab: tab }),

  statsMode: DEFAULT_MODE,
  statsRank: DEFAULT_RANK,
  setStatsMode: (mode) => set({ statsMode: mode }),
  setStatsRank: (rank) => set({ statsRank: rank }),

  enemyPicks: [],
  addEnemyPick: (id) =>
    set((state) => {
      if (state.enemyPicks.includes(id) || state.enemyPicks.length >= 5) return state;
      return { enemyPicks: [...state.enemyPicks, id] };
    }),
  removeEnemyPick: (id) =>
    set((state) => ({ enemyPicks: state.enemyPicks.filter((e) => e !== id) })),

  myTeam: [],
  enemyTeam: [],
  addToMyTeam: (id) =>
    set((state) => {
      if (state.myTeam.includes(id) || state.myTeam.length >= 5) return state;
      return { myTeam: [...state.myTeam, id] };
    }),
  removeFromMyTeam: (id) =>
    set((state) => ({ myTeam: state.myTeam.filter((e) => e !== id) })),
  addToEnemyTeam: (id) =>
    set((state) => {
      if (state.enemyTeam.includes(id) || state.enemyTeam.length >= 5) return state;
      return { enemyTeam: [...state.enemyTeam, id] };
    }),
  removeFromEnemyTeam: (id) =>
    set((state) => ({ enemyTeam: state.enemyTeam.filter((e) => e !== id) })),

  compareA: null,
  compareB: null,
  setCompareA: (id) => set({ compareA: id }),
  setCompareB: (id) => set({ compareB: id }),

  // Draft Sim
  simSlots: buildEmptySlots(),
  simStep: 0,
  simPickHero: (heroId) =>
    set((state) => {
      if (state.simStep >= TOTAL_STEPS) return state;
      const slots = state.simSlots.map((s, i) =>
        i === state.simStep ? { ...s, heroId } : s
      );
      return { simSlots: slots, simStep: state.simStep + 1 };
    }),
  simSkipBan: () =>
    set((state) => {
      if (!isBanStep(state.simStep) || state.simStep >= TOTAL_STEPS) return state;
      return { simStep: state.simStep + 1 };
    }),
  simSkipToPicks: () =>
    set((state) => {
      if (state.simStep >= FIRST_PICK_STEP_INDEX) return state;
      return { simStep: FIRST_PICK_STEP_INDEX };
    }),
  simClearSlot: (stepIndex) =>
    set((state) => {
      const slot = state.simSlots[stepIndex];
      if (!slot?.heroId) return state;
      const slots = state.simSlots.map((s, i) =>
        i >= stepIndex ? { ...s, heroId: null } : s
      );
      return { simSlots: slots, simStep: stepIndex };
    }),
  simUndo: () =>
    set((state) => {
      if (state.simStep <= 0) return state;
      const newStep = state.simStep - 1;
      const slots = state.simSlots.map((s, i) =>
        i === newStep ? { ...s, heroId: null } : s
      );
      return { simSlots: slots, simStep: newStep };
    }),
  simReset: () =>
    set({ simSlots: buildEmptySlots(), simStep: 0 }),

  clearAll: () =>
    set({
      enemyPicks: [],
      myTeam: [],
      enemyTeam: [],
      compareA: null,
      compareB: null,
      simSlots: buildEmptySlots(),
      simStep: 0,
    }),
}));
