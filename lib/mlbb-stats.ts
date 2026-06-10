import type { Hero, HeroRole, Lane, Tier } from "@/lib/types";
import { mlbbApiFetch, mlbbPageFetch, MLBB_API_BASE } from "@/lib/mlbb-http";
import { buildStatisticsUrl } from "@/lib/ranks";

const ROLE_MAP: Record<string, HeroRole> = {
  Tank: "Tank",
  Fighter: "Fighter",
  Assassin: "Assassin",
  Mage: "Mage",
  Marksman: "Marksman",
  Support: "Support",
};

const LANE_MAP: Record<string, Lane> = {
  "Exp Lane": "Exp",
  "Gold Lane": "Gold",
  "Mid Lane": "Mid",
  Jungle: "Jungle",
  Roam: "Roam",
};

export function normalizeHeroName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface MlbbHeroListItem {
  id: number;
  name: string;
}

interface MlbbHeroDetail {
  id: number;
  name: string;
  tier: string;
  roles: { name: string }[];
  lanes: { name: string; is_main?: boolean }[];
  specialties: { name: string }[];
  overview?: {
    win_rate?: string;
    pick_rate?: string;
    ban_rate?: string;
    current_tier?: string;
  };
}

interface MlbbCounterItem {
  id: number;
  name: string;
}

export interface StatsRefreshResult {
  heroes: Hero[];
  patch: string;
  statsUpdated: number;
  statsSkipped: number;
  countersUpdated: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mlbbFetch<T>(path: string, retries = 5): Promise<T | null> {
  const { data } = await mlbbApiFetch<T>(`${MLBB_API_BASE}${path}`, retries);
  return data;
}

async function fetchHeroListFallback(): Promise<MlbbHeroListItem[]> {
  const { html, error } = await mlbbPageFetch(buildStatisticsUrl("rank", "Mythic"));
  if (!html) {
    throw new Error(`Hero list fallback failed: ${error ?? "empty response"}`);
  }

  const pattern = /hero_id\\":(\d+)[^}]*?name\\":\\"([^\\]+)\\"/g;
  const heroes: MlbbHeroListItem[] = [];

  for (const match of html.matchAll(pattern)) {
    heroes.push({ id: Number(match[1]), name: match[2] });
  }

  if (!heroes.length) {
    throw new Error("Hero list fallback returned no heroes");
  }

  return heroes;
}

async function fetchHeroList(): Promise<MlbbHeroListItem[]> {
  const { data, status, error } = await mlbbApiFetch<MlbbHeroListItem[]>(
    `${MLBB_API_BASE}/heroes`
  );

  if (data?.length) return data;

  try {
    const fallback = await fetchHeroListFallback();
    return fallback;
  } catch (fallbackErr) {
    const detail = error ?? `HTTP ${status ?? "unknown"}`;
    const fbMsg =
      fallbackErr instanceof Error ? fallbackErr.message : "fallback failed";
    throw new Error(
      `Failed to fetch hero list from mlbb.gg (${detail}; fallback: ${fbMsg})`
    );
  }
}

function mapTier(tier: string): Tier {
  const t = tier.toUpperCase();
  if (t === "SS" || t === "S") return "S";
  if (t === "A") return "A";
  if (t === "B") return "B";
  if (t === "C") return "C";
  return "D";
}

function parseRate(value?: string): number {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

async function mapPool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 3
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) await sleep(120);
  }
  return results;
}

export async function refreshHeroStats(localHeroes: Hero[]): Promise<StatsRefreshResult> {
  const list = await fetchHeroList();

  const nameToMlbbId = new Map<string, number>();
  for (const h of list) {
    nameToMlbbId.set(normalizeHeroName(h.name), h.id);
  }

  const nameToLocalId = new Map<string, string>();
  for (const h of localHeroes) {
    nameToLocalId.set(normalizeHeroName(h.name), h.id);
  }

  let statsUpdated = 0;
  let statsSkipped = 0;

  const detailByLocalId = new Map<string, MlbbHeroDetail>();

  const heroesToFetch = localHeroes.filter((hero) => {
    if (!nameToMlbbId.has(normalizeHeroName(hero.name))) {
      statsSkipped++;
      return false;
    }
    return true;
  });

  await mapPool(heroesToFetch, async (hero) => {
    const mlbbId = nameToMlbbId.get(normalizeHeroName(hero.name))!;
    const detail = await mlbbFetch<MlbbHeroDetail>(`/heroes/${mlbbId}`);
    if (detail) {
      detailByLocalId.set(hero.id, detail);
      statsUpdated++;
    } else {
      statsSkipped++;
    }
  });

  const counteredByMap = new Map<string, string[]>();
  let countersUpdated = 0;

  await mapPool(
    [...detailByLocalId.entries()],
    async ([localId, detail]) => {
      const counters = await mlbbFetch<{ data: MlbbCounterItem[] }>(
        `/heroes/${detail.id}/counters`
      );
      if (!counters?.data) return;

      const ids = counters.data
        .map((c) => nameToLocalId.get(normalizeHeroName(c.name)))
        .filter((id): id is string => Boolean(id));

      counteredByMap.set(localId, ids);
      countersUpdated++;
    }
  );

  const strongAgainstMap = new Map<string, Set<string>>();
  for (const [targetId, counterIds] of counteredByMap) {
    for (const counterId of counterIds) {
      if (!strongAgainstMap.has(counterId)) strongAgainstMap.set(counterId, new Set());
      strongAgainstMap.get(counterId)!.add(targetId);
    }
  }

  const refreshedAt = new Date().toISOString().slice(0, 10);
  const patch = `${refreshedAt} · Mythic`;

  const heroes = localHeroes.map((hero) => {
    const detail = detailByLocalId.get(hero.id);
    if (!detail) return { ...hero, patch };

    const roles = [
      ...new Set(
        detail.roles
          .map((r) => ROLE_MAP[r.name])
          .filter((r): r is HeroRole => Boolean(r))
      ),
    ];

    const lanes = [
      ...new Set(
        detail.lanes
          .map((l) => LANE_MAP[l.name])
          .filter((l): l is Lane => Boolean(l))
      ),
    ];

    const counteredBy = counteredByMap.get(hero.id) ?? hero.counteredBy;
    const strongAgainst = [...(strongAgainstMap.get(hero.id) ?? new Set(hero.strongAgainst))];

    return {
      ...hero,
      tier: mapTier(detail.overview?.current_tier ?? detail.tier),
      role: roles.length ? roles : hero.role,
      lane: lanes.length ? lanes : hero.lane,
      specialty: detail.specialties.length
        ? detail.specialties.map((s) => s.name)
        : hero.specialty,
      winRate: parseRate(detail.overview?.win_rate),
      pickRate: parseRate(detail.overview?.pick_rate),
      banRate: parseRate(detail.overview?.ban_rate),
      counters: counteredBy,
      counteredBy,
      strongAgainst,
      patch,
    };
  });

  return {
    heroes,
    patch,
    statsUpdated,
    statsSkipped,
    countersUpdated,
  };
}
