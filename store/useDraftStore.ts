import { create } from "zustand";
import type { TabId } from "@/lib/types";
import {
  buildEmptySlots,
  findFirstEmptyBanStep,
  findFirstEmptyPickStep,
  findNextEmptyBanStep,
  findNextEmptyPickStep,
  isHeroDisabledForSlot,
  type DraftMode,
  type DraftSlot,
  type DraftTeam,
} from "@/lib/draft";
import { DEFAULT_MODE, DEFAULT_RANK, type RankFilter, type StatsMode } from "@/lib/ranks";

interface DraftStore {
  activeTab: TabId;
  setTab: (tab: TabId) => void;

  statsMode: StatsMode;
  statsRank: RankFilter;
  setStatsMode: (mode: StatsMode) => void;
  setStatsRank: (rank: RankFilter) => void;

  enemyPicks: string[];
  addEnemyPick: (id: string) => void;
  removeEnemyPick: (id: string) => void;

  myTeam: string[];
  enemyTeam: string[];
  addToMyTeam: (id: string) => void;
  removeFromMyTeam: (id: string) => void;
  addToEnemyTeam: (id: string) => void;
  removeFromEnemyTeam: (id: string) => void;

  compareA: string | null;
  compareB: string | null;
  setCompareA: (id: string | null) => void;
  setCompareB: (id: string | null) => void;

  simSlots: DraftSlot[];
  simDraftMode: DraftMode;
  simSelectedStep: number | null;
  simFirstPickTeam: DraftTeam;
  simSelectSlot: (stepIndex: number) => void;
  simAssignHero: (heroId: string) => void;
  simClearSlot: (stepIndex: number) => void;
  simSetDraftMode: (mode: DraftMode) => void;
  simSetFirstPickTeam: (team: DraftTeam) => void;
  simReset: () => void;

  clearAll: () => void;
}

function createInitialSimState() {
  const slots = buildEmptySlots();
  return {
    simSlots: slots,
    simDraftMode: "ban" as DraftMode,
    simSelectedStep: findFirstEmptyBanStep(slots),
    simFirstPickTeam: "blue" as DraftTeam,
  };
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

  ...createInitialSimState(),

  simSelectSlot: (stepIndex) =>
    set((state) => {
      const slot = state.simSlots[stepIndex];
      if (!slot || slot.heroId) return state;
      if (slot.action.type !== state.simDraftMode) return state;
      return { simSelectedStep: stepIndex };
    }),

  simAssignHero: (heroId) =>
    set((state) => {
      const stepIndex = state.simSelectedStep;
      if (stepIndex === null) return state;

      const slot = state.simSlots[stepIndex];
      if (!slot || slot.heroId) return state;
      if (slot.action.type !== state.simDraftMode) return state;
      if (isHeroDisabledForSlot(heroId, slot, state.simSlots)) return state;

      const slots = state.simSlots.map((s, i) =>
        i === stepIndex ? { ...s, heroId } : s
      );

      const nextSelected =
        state.simDraftMode === "ban"
          ? findNextEmptyBanStep(slots, stepIndex)
          : findNextEmptyPickStep(slots, stepIndex);

      return { simSlots: slots, simSelectedStep: nextSelected };
    }),

  simClearSlot: (stepIndex) =>
    set((state) => {
      const slot = state.simSlots[stepIndex];
      if (!slot?.heroId) return state;
      const slots = state.simSlots.map((s, i) =>
        i === stepIndex ? { ...s, heroId: null } : s
      );
      return {
        simSlots: slots,
        simSelectedStep: stepIndex,
      };
    }),

  simSetDraftMode: (mode) =>
    set((state) => ({
      simDraftMode: mode,
      simSelectedStep:
        mode === "ban"
          ? findFirstEmptyBanStep(state.simSlots)
          : findFirstEmptyPickStep(state.simSlots),
    })),

  simSetFirstPickTeam: (team) => set({ simFirstPickTeam: team }),

  simReset: () => set(createInitialSimState()),

  clearAll: () =>
    set({
      enemyPicks: [],
      myTeam: [],
      enemyTeam: [],
      compareA: null,
      compareB: null,
      ...createInitialSimState(),
    }),
}));
