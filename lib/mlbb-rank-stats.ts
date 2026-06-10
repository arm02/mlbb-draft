import { normalizeHeroName } from "@/lib/mlbb-stats";
import { mlbbPageFetch } from "@/lib/mlbb-http";
import type { Tier } from "@/lib/types";
import {
  buildStatisticsUrl,
  getStatsKey,
  RANK_OPTIONS,
  type RankFilter,
  type StatsMode,
} from "@/lib/ranks";

export interface RankHeroStats {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: Tier;
}

export type RankStatsBundle = Record<string, Record<string, RankHeroStats>>;

export interface RankStatsRefreshResult {
  bundle: RankStatsBundle;
  refreshedAt: string;
  updated: string[];
  cached: string[];
}

const RANK_PATTERN =
  /\\"name\\":\\"([^\\]+)\\",\\"tier\\":\\"([^\\]+)\\",\\"points\\":\\"[^\\]+\\",\\"tier_color\\":[^,]+,\\"win_rate\\":\\"([^\\]+)\\",\\"ban_rate\\":\\"([^\\]+)\\",\\"pick_rate\\":\\"([^\\]+)\\"/g;

const PRO_PATTERN =
  /\\"name\\":\\"([^\\]+)\\",\\"tier\\":\\"([^\\]+)\\",\\"points\\":\d+,\\"tier_color\\":[^,]+,\\"win_rate\\":([0-9.]+),\\"ban_rate\\":([0-9.]+),\\"pick_rate\\":([0-9.]+)/g;

function mapTier(tier: string): Tier {
  const t = tier.toUpperCase();
  if (t === "SS" || t === "S") return "S";
  if (t === "A") return "A";
  if (t === "B") return "B";
  if (t === "C") return "C";
  return "D";
}

function parseRate(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function parseMatches(
  html: string,
  mode: StatsMode
): { name: string; tier: string; winRate: string; banRate: string; pickRate: string }[] {
  const pattern = mode === "pro" ? PRO_PATTERN : RANK_PATTERN;
  const matches: {
    name: string;
    tier: string;
    winRate: string;
    banRate: string;
    pickRate: string;
  }[] = [];

  for (const m of html.matchAll(pattern)) {
    matches.push({
      name: m[1],
      tier: m[2],
      winRate: m[3],
      banRate: m[4],
      pickRate: m[5],
    });
  }

  return matches;
}

function toStatsMap(stats: RankHeroStats[]): Record<string, RankHeroStats> {
  return Object.fromEntries(stats.map((s) => [normalizeHeroName(s.name), s]));
}

export async function fetchRankStats(
  mode: StatsMode,
  rank: RankFilter
): Promise<RankHeroStats[]> {
  const url = buildStatisticsUrl(mode, rank);
  const { html, status, error } = await mlbbPageFetch(url);

  if (!html) {
    throw new Error(
      `Failed to fetch stats for ${getStatsKey(mode, rank)} (${error ?? `HTTP ${status}`})`
    );
  }
  const matches = parseMatches(html, mode);

  if (!matches.length) {
    throw new Error(`No hero stats found for ${getStatsKey(mode, rank)}`);
  }

  return matches.map((m) => ({
    name: m.name,
    winRate: parseRate(m.winRate),
    pickRate: parseRate(m.pickRate),
    banRate: parseRate(m.banRate),
    tier: mapTier(m.tier),
  }));
}

export async function fetchAllRankStats(
  existingBundle?: RankStatsBundle | null
): Promise<RankStatsRefreshResult> {
  const bundle: RankStatsBundle = existingBundle ? { ...existingBundle } : {};
  const updated: string[] = [];
  const cached: string[] = [];
  const refreshedAt = new Date().toISOString();

  for (const rank of RANK_OPTIONS) {
    const key = getStatsKey("rank", rank);
    try {
      const stats = await fetchRankStats("rank", rank);
      bundle[key] = toStatsMap(stats);
      updated.push(key);
    } catch {
      if (bundle[key]) {
        cached.push(key);
      }
    }
    await sleep(200);
  }

  try {
    const proStats = await fetchRankStats("pro", "pro");
    bundle.pro = toStatsMap(proStats);
    updated.push("pro");
  } catch {
    if (bundle.pro) {
      cached.push("pro");
    }
  }

  if (!updated.length && !Object.keys(bundle).length) {
    throw new Error(
      "Failed to fetch rank stats from mlbb.gg and no cached data available"
    );
  }

  return { bundle, refreshedAt, updated, cached };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
