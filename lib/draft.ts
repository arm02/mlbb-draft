export type DraftTeam = "blue" | "red";
export type DraftActionType = "ban" | "pick";

export interface DraftAction {
  type: DraftActionType;
  team: DraftTeam;
  phase: 1 | 2 | 3; // 1 = ban p1, 2 = ban p2, 3 = pick
}

// MLBB 5v5 draft order (simultaneous bans — each team bans together):
//
// Ban Phase 1  — Blue bans 3, then Red bans 3
// Ban Phase 2  — Blue bans 2, then Red bans 2
// Pick Phase   — snake: B, RR, BB, RR, BB, R
//
export const DRAFT_ORDER: DraftAction[] = [
  // ── Ban Phase 1: Blue bans 3 ──────────────────────────────────
  { type: "ban",  team: "blue", phase: 1 },
  { type: "ban",  team: "blue", phase: 1 },
  { type: "ban",  team: "blue", phase: 1 },
  // ── Ban Phase 1: Red bans 3 ───────────────────────────────────
  { type: "ban",  team: "red",  phase: 1 },
  { type: "ban",  team: "red",  phase: 1 },
  { type: "ban",  team: "red",  phase: 1 },
  // ── Ban Phase 2: Blue bans 2 ──────────────────────────────────
  { type: "ban",  team: "blue", phase: 2 },
  { type: "ban",  team: "blue", phase: 2 },
  // ── Ban Phase 2: Red bans 2 ───────────────────────────────────
  { type: "ban",  team: "red",  phase: 2 },
  { type: "ban",  team: "red",  phase: 2 },
  // ── Pick Phase: snake B, RR, BB, RR, BB, R ────────────────────
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red",  phase: 3 },
  { type: "pick", team: "red",  phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red",  phase: 3 },
  { type: "pick", team: "red",  phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "blue", phase: 3 },
  { type: "pick", team: "red",  phase: 3 },
];

export const TOTAL_STEPS = DRAFT_ORDER.length; // 20

export const FIRST_PICK_STEP_INDEX = DRAFT_ORDER.findIndex((a) => a.type === "pick");

export function isBanStep(step: number): boolean {
  return step >= 0 && step < FIRST_PICK_STEP_INDEX;
}

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

export function getUsedHeroIds(slots: DraftSlot[]): Set<string> {
  const used = new Set<string>();
  slots.forEach((s) => { if (s.heroId) used.add(s.heroId); });
  return used;
}

export function getPhaseName(step: number): string {
  if (step < 3)  return "Ban Phase 1 — Blue (optional)";
  if (step < 6)  return "Ban Phase 1 — Red (optional)";
  if (step < 8)  return "Ban Phase 2 — Blue (optional)";
  if (step < 10) return "Ban Phase 2 — Red (optional)";
  if (step < 20) return "Pick Phase";
  return "Draft Complete";
}
