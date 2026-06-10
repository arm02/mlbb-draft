/**
 * Run: npm run seed
 *
 * Downloads MLBB hero portrait images from the Mobile Legends Fandom wiki CDN
 * and saves them as /public/heroes/[id].webp (64×64, WebP)
 *
 * To add more heroes:
 *  1. Run: curl -sL "https://mobile-legends.fandom.com/api.php?action=query&prop=pageimages&titles=HeroName&pithumbsize=100&format=json" | python3 -m json.tool
 *  2. Copy the "source" URL (strip the ?cb= part) and add it to WIKI_IMAGE_MAP below.
 */

import { mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_IMG_DIR = join(__dirname, "../public/heroes");

// hero id → Fandom wiki CDN portrait URL
const WIKI_IMAGE_MAP: Record<string, string> = {
  aldous: "https://static.wikia.nocookie.net/mobile-legends/images/6/61/Hero641-portrait.png",
  atlas: "https://static.wikia.nocookie.net/mobile-legends/images/7/7c/Hero931-portrait.png",
  beatrix: "https://static.wikia.nocookie.net/mobile-legends/images/d/de/Hero1051-portrait.png",
  benedetta: "https://static.wikia.nocookie.net/mobile-legends/images/1/1d/Hero971-portrait.png",
  chou: "https://static.wikia.nocookie.net/mobile-legends/images/e/ed/Hero261-portrait.png",
  diggie: "https://static.wikia.nocookie.net/mobile-legends/images/1/17/Hero481-portrait.png",
  esmeralda: "https://static.wikia.nocookie.net/mobile-legends/images/4/42/Hero811-portrait.png",
  fanny: "https://static.wikia.nocookie.net/mobile-legends/images/7/7f/Hero171-portrait.png",
  franco: "https://static.wikia.nocookie.net/mobile-legends/images/b/b3/Hero101-portrait.png",
  grock: "https://static.wikia.nocookie.net/mobile-legends/images/9/95/Hero441-portrait.png",
  gusion: "https://static.wikia.nocookie.net/mobile-legends/images/a/a2/Hero561-portrait.png",
  harith: "https://static.wikia.nocookie.net/mobile-legends/images/3/36/Hero731-portrait.png",
  harley: "https://static.wikia.nocookie.net/mobile-legends/images/8/81/Hero421-portrait.png",
  hayabusa: "https://static.wikia.nocookie.net/mobile-legends/images/3/35/Hero211-portrait.png",
  jawhead: "https://static.wikia.nocookie.net/mobile-legends/images/2/2c/Hero541-portrait.png",
  johnson: "https://static.wikia.nocookie.net/mobile-legends/images/4/4a/Hero321-portrait.png",
  kagura: "https://static.wikia.nocookie.net/mobile-legends/images/8/8e/Hero251-portrait.png",
  karina: "https://static.wikia.nocookie.net/mobile-legends/images/4/41/Hero081-portrait.png",
  khufra: "https://static.wikia.nocookie.net/mobile-legends/images/0/0f/Hero781-portrait.png",
  lancelot: "https://static.wikia.nocookie.net/mobile-legends/images/d/df/Hero471-portrait.png",
  lesley: "https://static.wikia.nocookie.net/mobile-legends/images/f/f1/Hero531-portrait.png",
  ling: "https://static.wikia.nocookie.net/mobile-legends/images/e/e0/Hero841-portrait.png",
  lunox: "https://static.wikia.nocookie.net/mobile-legends/images/d/d8/Hero681-portrait.png",
  lylia: "https://static.wikia.nocookie.net/mobile-legends/images/e/ef/Hero861-portrait.png",
  mathilda: "https://static.wikia.nocookie.net/mobile-legends/images/9/92/Hero1021-portrait.png",
  moskov: "https://static.wikia.nocookie.net/mobile-legends/images/6/60/Hero311-portrait.png",
  paquito: "https://static.wikia.nocookie.net/mobile-legends/images/a/a9/Hero1031-portrait.png",
  tigreal: "https://static.wikia.nocookie.net/mobile-legends/images/b/b8/Hero061-portrait.png",
  valentina: "https://static.wikia.nocookie.net/mobile-legends/images/1/12/Hero1101-portrait.png",
  yve: "https://static.wikia.nocookie.net/mobile-legends/images/1/10/Hero1011-portrait.png",
};

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "mlbb-draft/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Downloading MLBB hero images...\n");

  if (!existsSync(OUTPUT_IMG_DIR)) {
    mkdirSync(OUTPUT_IMG_DIR, { recursive: true });
  }

  let ok = 0;
  let fail = 0;

  for (const [id, url] of Object.entries(WIKI_IMAGE_MAP)) {
    const dest = join(OUTPUT_IMG_DIR, `${id}.webp`);
    process.stdout.write(`  ${id.padEnd(14)}`);
    try {
      const buf = await fetchBuffer(url);
      await sharp(buf)
        .resize(64, 64, { fit: "cover", position: "top" })
        .webp({ quality: 88 })
        .toFile(dest);
      console.log("✓");
      ok++;
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} downloaded, ${fail} failed.`);
  console.log(
    "\nTo add more heroes, query:\n" +
      "  curl -sL 'https://mobile-legends.fandom.com/api.php?action=query&prop=pageimages&titles=HeroName&pithumbsize=100&format=json'"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
