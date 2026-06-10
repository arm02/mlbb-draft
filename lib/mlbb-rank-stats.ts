import { normalizeHeroName } from "@/lib/mlbb-stats";
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

const USER_AGENT = "Mozilla/5.0 (compatible; mlbb-draft/1.0)";

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

export async function fetchRankStats(
  mode: StatsMode,
  rank: RankFilter
): Promise<RankHeroStats[]> {
  const url = buildStatisticsUrl(mode, rank);
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stats for ${getStatsKey(mode, rank)} (${res.status})`);
  }

  const html = await res.text();
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

export async function fetchAllRankStats(): Promise<{
  bundle: RankStatsBundle;
  refreshedAt: string;
}> {
  const bundle: RankStatsBundle = {};
  const refreshedAt = new Date().toISOString();

  for (const rank of RANK_OPTIONS) {
    const key = getStatsKey("rank", rank);
    const stats = await fetchRankStats("rank", rank);
    bundle[key] = Object.fromEntries(
      stats.map((s) => [normalizeHeroName(s.name), s])
    );
    await sleep(200);
  }

  const proStats = await fetchRankStats("pro", "pro");
  bundle.pro = Object.fromEntries(
    proStats.map((s) => [normalizeHeroName(s.name), s])
  );

  return { bundle, refreshedAt };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
