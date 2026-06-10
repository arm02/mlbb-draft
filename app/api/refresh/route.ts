/**
 * POST /api/refresh
 * Re-fetches hero portrait URLs from MLBB Fandom wiki and updates /public/heroes/*.webp
 * Returns updated hero count and timestamp.
 *
 * No auth required (local dev). For production add CRON_SECRET guard if desired.
 */

import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import https from "https";

const IMG_DIR = join(process.cwd(), "public", "heroes");
const HEROES_JSON = join(process.cwd(), "public", "data", "heroes.json");

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string) => {
      https.get(u, { headers: { "User-Agent": "mlbb-draft/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.headers.location)
          return get(res.headers.location);
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
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
      const res = await fetch(url, { headers: { "User-Agent": "mlbb-draft/1.0" } });
      const json = (await res.json()) as {
        query?: { pages?: Record<string, { title: string; thumbnail?: { source: string } }> };
      };
      for (const page of Object.values(json?.query?.pages ?? {})) {
        const thumb = page.thumbnail?.source ?? "";
        result[page.title] = thumb.split("/revision/")[0];
      }
    } catch { /* continue */ }
  }
  return result;
}

export async function POST() {
  try {
    if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

    const heroes: Array<{ id: string; name: string }> = JSON.parse(
      readFileSync(HEROES_JSON, "utf-8")
    );

    const uniqueNames = [...new Set(heroes.map((h) => h.name))];
    const portraits = await getPortraitUrls(uniqueNames);

    const { default: sharp } = await import("sharp");
    let ok = 0;
    let fail = 0;

    for (const hero of heroes) {
      const pUrl = portraits[hero.name];
      if (!pUrl) { fail++; continue; }

      const dest = join(IMG_DIR, `${hero.id}.webp`);
      try {
        const buf = await fetchBuffer(pUrl);
        await sharp(buf)
          .resize(64, 64, { fit: "cover", position: "top" })
          .webp({ quality: 88 })
          .toFile(dest);
        ok++;
      } catch { fail++; }
    }

    // Bump patch label to show freshness
    const heroData: Array<Record<string, unknown>> = JSON.parse(
      readFileSync(HEROES_JSON, "utf-8")
    );
    const updated = heroData.map((h) => ({
      ...h,
      patch: new Date().toISOString().slice(0, 10),
    }));
    writeFileSync(HEROES_JSON, JSON.stringify(updated, null, 2));

    return NextResponse.json({
      success: true,
      total: heroes.length,
      imagesUpdated: ok,
      imagesFailed: fail,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
