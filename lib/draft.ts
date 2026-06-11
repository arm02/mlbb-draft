export type DraftTeam = "blue" | "red";
export type DraftActionType = "ban" | "pick";
export type DraftMode = "ban" | "pick";

export interface DraftAction {
  type: DraftActionType;
  team: DraftTeam;
  phase: 1 | 2 | 3;
}

export const DRAFT_ORDER: DraftAction[] = [
  { type: "ban", team: "blue", phase: 1 },
  { type: "ban", team: "blue", phase: 1 },
  { type: "ban", team: "blue", phase: 1 },
  { type: "ban", team: "red", phase: 1 },
  { type: "ban", team: "red", phase: 1 },
  { type: "ban", team: "red", phase: 1 },
  { type: "ban", team: "blue", phase: 2 },
  { type: "ban", team: "blue", phase: 2 },
  { type: "ban", team: "red", phase: 2 },
  { type: "ban", team: "red", phase: 2 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red", phase: 3 },
  { type: "pick", team: "red", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red", phase: 3 },
  { type: "pick", team: "red", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red", phase: 3 },
];

export const TOTAL_STEPS = DRAFT_ORDER.length;
export const FIRST_PICK_STEP_INDEX = DRAFT_ORDER.findIndex((a) => a.type === "pick");
export const BAN_SLOT_COUNT = FIRST_PICK_STEP_INDEX;
export const PICK_SLOT_COUNT = TOTAL_STEPS - FIRST_PICK_STEP_INDEX;

export interface DraftSlot {
  step: number;
  action: DraftAction;
  heroId: string | null;
}

export function buildEmptySlots(): DraftSlot[] {
  return DRAFT_ORDER.map((action, i) => ({ step: i, action, heroId: null }));
}

export function getTeamBans(slots: DraftSlot[], team: DraftTeam): DraftSlot[] {
  return slots.filter((s) => s.action.team === team && s.action.type === "ban");
}

export function getTeamPicks(slots: DraftSlot[], team: DraftTeam): DraftSlot[] {
  return slots.filter((s) => s.action.team === team && s.action.type === "pick");
}

export function getPickedHeroIds(slots: DraftSlot[]): Set<string> {
  const ids = new Set<string>();
  slots.forEach((s) => {
    if (s.action.type === "pick" && s.heroId) ids.add(s.heroId);
  });
  return ids;
}

export function getBannedHeroIds(slots: DraftSlot[]): Set<string> {
  const ids = new Set<string>();
  slots.forEach((s) => {
    if (s.action.type === "ban" && s.heroId) ids.add(s.heroId);
  });
  return ids;
}

/** Heroes unavailable for picks (any ban or pick elsewhere). */
export function getUnavailableForPick(slots: DraftSlot[]): Set<string> {
  const ids = new Set<string>();
  slots.forEach((s) => {
    if (s.heroId) ids.add(s.heroId);
  });
  return ids;
}

/** Same-team ban slots may duplicate heroes; only picks block new bans. */
export function isHeroDisabledForSlot(
  heroId: string,
  targetSlot: DraftSlot,
  slots: DraftSlot[]
): boolean {
  if (targetSlot.action.type === "ban") {
    return slots.some(
      (s) => s.step !== targetSlot.step && s.action.type === "pick" && s.heroId === heroId
    );
  }
  return slots.some((s) => s.step !== targetSlot.step && s.heroId === heroId);
}

export function isPickPhaseComplete(slots: DraftSlot[]): boolean {
  return slots
    .filter((s) => s.action.type === "pick")
    .every((s) => s.heroId !== null);
}

export function canSelectSlot(step: number, mode: DraftMode): boolean {
  const action = DRAFT_ORDER[step];
  if (!action) return false;
  if (mode === "ban") return action.type === "ban";
  return action.type === "pick";
}

export function findFirstEmptyBanStep(slots: DraftSlot[]): number | null {
  for (let step = 0; step < FIRST_PICK_STEP_INDEX; step++) {
    if (!slots[step]?.heroId) return step;
  }
  return null;
}

export function findNextEmptyBanStep(
  slots: DraftSlot[],
  afterStep: number
): number | null {
  for (let step = afterStep + 1; step < FIRST_PICK_STEP_INDEX; step++) {
    if (!slots[step]?.heroId) return step;
  }
  return null;
}

export function findFirstEmptyPickStep(slots: DraftSlot[]): number | null {
  for (let step = FIRST_PICK_STEP_INDEX; step < TOTAL_STEPS; step++) {
    if (!slots[step]?.heroId) return step;
  }
  return null;
}

export function findNextEmptyPickStep(
  slots: DraftSlot[],
  afterStep: number
): number | null {
  for (let step = afterStep + 1; step < TOTAL_STEPS; step++) {
    if (!slots[step]?.heroId) return step;
  }
  return null;
}
