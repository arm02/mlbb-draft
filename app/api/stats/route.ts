import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { RankStatsBundle } from "@/lib/mlbb-rank-stats";
import { fetchRankStats } from "@/lib/mlbb-rank-stats";
import { getStatsKey, type RankFilter, type StatsMode } from "@/lib/ranks";
import { normalizeHeroName } from "@/lib/mlbb-stats";

const RANK_STATS_JSON = join(process.cwd(), "public", "data", "rank-stats.json");

function loadBundle(): RankStatsBundle | null {
  if (!existsSync(RANK_STATS_JSON)) return null;
  try {
    const raw = JSON.parse(readFileSync(RANK_STATS_JSON, "utf-8")) as {
      bundle?: RankStatsBundle;
    };
    return raw.bundle ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") === "pro" ? "pro" : "rank") as StatsMode;
  const rank = (searchParams.get("rank") ?? "Mythical Glory Plus") as RankFilter;
  const key = getStatsKey(mode, rank);

  const bundle = loadBundle();
  if (bundle?.[key]) {
    return NextResponse.json({
      key,
      stats: bundle[key],
      source: "cache",
    });
  }

  try {
    const stats = await fetchRankStats(mode, rank);
    const map = Object.fromEntries(stats.map((s) => [normalizeHeroName(s.name), s]));
    return NextResponse.json({
      key,
      stats: map,
      source: "live",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
