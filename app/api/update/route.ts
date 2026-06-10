import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Hero } from "@/lib/types";
import { refreshHeroStats } from "@/lib/mlbb-stats";
import { fetchAllRankStats } from "@/lib/mlbb-rank-stats";

const HEROES_JSON = join(process.cwd(), "public", "data", "heroes.json");
const META_JSON = join(process.cwd(), "public", "data", "meta.json");
const RANK_STATS_JSON = join(process.cwd(), "public", "data", "rank-stats.json");

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const localHeroes: Hero[] = JSON.parse(readFileSync(HEROES_JSON, "utf-8"));
    const result = await refreshHeroStats(localHeroes);
    const rankStatsResult = await fetchAllRankStats();

    writeFileSync(HEROES_JSON, JSON.stringify(result.heroes, null, 2));
    writeFileSync(
      RANK_STATS_JSON,
      JSON.stringify(
        {
          refreshedAt: rankStatsResult.refreshedAt,
          source: "mlbb.gg statistics",
          bundle: rankStatsResult.bundle,
        },
        null,
        2
      )
    );

    writeFileSync(
      META_JSON,
      JSON.stringify(
        {
          patch: result.patch,
          source: "mlbb.gg · all ranks + counters",
          refreshedAt: new Date().toISOString(),
          statsUpdated: result.statsUpdated,
          statsSkipped: result.statsSkipped,
          countersUpdated: result.countersUpdated,
          rankStatsRefreshedAt: rankStatsResult.refreshedAt,
        },
        null,
        2
      )
    );

    return NextResponse.json({
      success: true,
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
