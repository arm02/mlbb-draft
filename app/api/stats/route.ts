import { NextResponse } from "next/server";
import type { RankStatsBundle } from "@/lib/mlbb-rank-stats";
import { fetchRankStats } from "@/lib/mlbb-rank-stats";
import { getStatsKey, type RankFilter, type StatsMode } from "@/lib/ranks";
import { normalizeHeroName } from "@/lib/mlbb-stats";
import { readJsonFileAsync } from "@/lib/data-store";

export const dynamic = "force-dynamic";

interface RankStatsFile {
  bundle?: RankStatsBundle;
}

async function loadBundle(): Promise<RankStatsBundle | null> {
  try {
    const raw = await readJsonFileAsync<RankStatsFile>("rank-stats.json");
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

  const bundle = await loadBundle();
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
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
