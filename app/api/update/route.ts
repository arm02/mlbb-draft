import { NextRequest, NextResponse } from "next/server";
import type { Hero } from "@/lib/types";
import { refreshHeroStats } from "@/lib/mlbb-stats";
import { fetchAllRankStats } from "@/lib/mlbb-rank-stats";
import {
  isVercelDeploy,
  readJsonFileAsync,
  writeJsonFileAsync,
} from "@/lib/data-store";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const localHeroes = await readJsonFileAsync<Hero[]>("heroes.json");

    let existingBundle: Awaited<ReturnType<typeof fetchAllRankStats>>["bundle"] | undefined;
    try {
      const existing = await readJsonFileAsync<{ bundle?: typeof existingBundle }>(
        "rank-stats.json"
      );
      existingBundle = existing.bundle;
    } catch {
      /* no cached rank stats yet */
    }

    const rankStatsResult = await fetchAllRankStats(existingBundle);

    await writeJsonFileAsync("rank-stats.json", {
      refreshedAt: rankStatsResult.refreshedAt,
      source: "mlbb.gg statistics",
      bundle: rankStatsResult.bundle,
    });

    if (isVercelDeploy()) {
      await writeJsonFileAsync("meta.json", {
        source:
          rankStatsResult.updated.length === 0
            ? "cached rank stats (Vercel cron)"
            : "mlbb.gg statistics (Vercel cron)",
        refreshedAt: new Date().toISOString(),
        rankStatsRefreshedAt: rankStatsResult.refreshedAt,
        rankStatsUpdated: rankStatsResult.updated,
        rankStatsCached: rankStatsResult.cached,
      });

      return NextResponse.json({
        success: true,
        mode: "vercel-fast",
        count: localHeroes.length,
        rankStatsRefreshedAt: rankStatsResult.refreshedAt,
        rankStatsUpdated: rankStatsResult.updated,
        rankStatsCached: rankStatsResult.cached,
        updatedAt: new Date().toISOString(),
      });
    }

    const result = await refreshHeroStats(localHeroes);

    await writeJsonFileAsync("heroes.json", result.heroes);
    await writeJsonFileAsync("meta.json", {
      patch: result.patch,
      source: "mlbb.gg · all ranks + counters",
      refreshedAt: new Date().toISOString(),
      statsUpdated: result.statsUpdated,
      statsSkipped: result.statsSkipped,
      countersUpdated: result.countersUpdated,
      rankStatsRefreshedAt: rankStatsResult.refreshedAt,
    });

    return NextResponse.json({
      success: true,
      mode: "full",
      count: result.heroes.length,
      patch: result.patch,
      statsUpdated: result.statsUpdated,
      statsSkipped: result.statsSkipped,
      countersUpdated: result.countersUpdated,
      rankStatsRefreshedAt: rankStatsResult.refreshedAt,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
