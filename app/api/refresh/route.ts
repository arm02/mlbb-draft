/**
 * POST /api/refresh
 * Updates hero stats from mlbb.gg and portrait images from Fandom wiki.
 * On Vercel: fast refresh (rank stats only) — requires BLOB_READ_WRITE_TOKEN to persist.
 */

import { NextRequest, NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import https from "https";
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

const IMG_DIR = join(process.cwd(), "public", "heroes");

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string) => {
      https
        .get(u, { headers: { "User-Agent": "mlbb-draft/1.0" } }, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.headers.location)
            return get(res.headers.location);
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        })
        .on("error", reject);
    };
    get(url);
  });
}

async function getPortraitUrls(names: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const BATCH = 50;
  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH);
    const titleStr = batch.map(encodeURIComponent).join("|");
    const url =
      `https://mobile-legends.fandom.com/api.php?action=query` +
      `&prop=pageimages&titles=${titleStr}&pithumbsize=200&format=json`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "mlbb-draft/1.0" },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        query?: { pages?: Record<string, { title: string; thumbnail?: { source: string } }> };
      };
      for (const page of Object.values(json?.query?.pages ?? {})) {
        const thumb = page.thumbnail?.source ?? "";
        result[page.title] = thumb.split("/revision/")[0];
      }
    } catch {
      /* continue */
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-refresh-password");
  const expected = process.env.REFRESH_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: "Refresh is not configured" }, { status: 503 });
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const onVercel = isVercelDeploy();

  try {
    const localHeroes = await readJsonFileAsync<Hero[]>("heroes.json");

    // 1. Rank stats — always refresh (scrapes mlbb.gg, works on Vercel)
    const rankStatsResult = await fetchAllRankStats();
    await writeJsonFileAsync("rank-stats.json", {
      refreshedAt: rankStatsResult.refreshedAt,
      source: "mlbb.gg statistics",
      bundle: rankStatsResult.bundle,
    });

    if (onVercel) {
      const meta = {
        patch: new Date().toISOString().slice(0, 10) + " · all ranks",
        source: "mlbb.gg statistics (Vercel fast refresh)",
        refreshedAt: new Date().toISOString(),
        rankStatsRefreshedAt: rankStatsResult.refreshedAt,
      };
      await writeJsonFileAsync("meta.json", meta);

      return NextResponse.json({
        success: true,
        mode: "vercel-fast",
        total: localHeroes.length,
        rankStatsRefreshedAt: rankStatsResult.refreshedAt,
        refreshedAt: new Date().toISOString(),
        message:
          "Rank stats updated. Full counter/image refresh requires Docker deploy or local refresh + push.",
      });
    }

    // 2. Full refresh — local / Docker only
    if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

    const statsResult = await refreshHeroStats(localHeroes);
    await writeJsonFileAsync("heroes.json", statsResult.heroes);

    const meta = {
      patch: statsResult.patch,
      source: "mlbb.gg · all ranks + counters",
      refreshedAt: new Date().toISOString(),
      statsUpdated: statsResult.statsUpdated,
      statsSkipped: statsResult.statsSkipped,
      countersUpdated: statsResult.countersUpdated,
      rankStatsRefreshedAt: rankStatsResult.refreshedAt,
    };
    await writeJsonFileAsync("meta.json", meta);

    const uniqueNames = [...new Set(statsResult.heroes.map((h) => h.name))];
    const portraits = await getPortraitUrls(uniqueNames);

    const { default: sharp } = await import("sharp");
    let imagesOk = 0;
    let imagesFail = 0;

    for (const hero of statsResult.heroes) {
      const pUrl = portraits[hero.name];
      if (!pUrl) {
        imagesFail++;
        continue;
      }

      const dest = join(IMG_DIR, `${hero.id}.webp`);
      try {
        const buf = await fetchBuffer(pUrl);
        await sharp(buf)
          .resize(64, 64, { fit: "cover", position: "top" })
          .webp({ quality: 88 })
          .toFile(dest);
        imagesOk++;
      } catch {
        imagesFail++;
      }
    }

    return NextResponse.json({
      success: true,
      mode: "full",
      total: statsResult.heroes.length,
      patch: statsResult.patch,
      statsUpdated: statsResult.statsUpdated,
      statsSkipped: statsResult.statsSkipped,
      countersUpdated: statsResult.countersUpdated,
      rankStatsRefreshedAt: rankStatsResult.refreshedAt,
      imagesUpdated: imagesOk,
      imagesFailed: imagesFail,
      refreshedAt: new Date().toISOString(),
      source: "mlbb.gg + Fandom wiki",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
