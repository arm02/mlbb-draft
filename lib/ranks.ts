export type StatsMode = "rank" | "pro";

export const RANK_OPTIONS = [
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory Plus",
] as const;

export type RankFilter = (typeof RANK_OPTIONS)[number] | "pro";

export const DEFAULT_RANK: RankFilter = "Mythical Glory Plus";
export const DEFAULT_MODE: StatsMode = "rank";

export function getStatsKey(mode: StatsMode, rank: RankFilter): string {
  return mode === "pro" ? "pro" : rank;
}

export function getStatsLabel(mode: StatsMode, rank: RankFilter): string {
  return mode === "pro" ? "Pro" : rank;
}

export function buildStatisticsUrl(mode: StatsMode, rank: RankFilter): string {
  if (mode === "pro") {
    return "https://mlbb.gg/statistics?mode=pro&rank_filter=pro";
  }
  return `https://mlbb.gg/statistics?rank_filter=${encodeURIComponent(rank)}`;
}
