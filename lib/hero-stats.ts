import { normalizeHeroName } from "@/lib/mlbb-stats";
import type { RankHeroStats } from "@/lib/mlbb-rank-stats";
import { getStatsLabel, type RankFilter, type StatsMode } from "@/lib/ranks";
import type { Hero } from "@/lib/types";

export function mergeHeroStats(
  heroes: Hero[],
  statsMap: Record<string, RankHeroStats> | undefined,
  mode: StatsMode,
  rank: RankFilter
): Hero[] {
  if (!statsMap) return heroes;

  const label = getStatsLabel(mode, rank);
  const patchDate = new Date().toISOString().slice(0, 10);

  return heroes.map((hero) => {
    const stats = statsMap[normalizeHeroName(hero.name)];
    if (!stats) return { ...hero, patch: `${patchDate} · ${label}` };

    return {
      ...hero,
      winRate: stats.winRate,
      pickRate: stats.pickRate,
      banRate: stats.banRate,
      tier: stats.tier,
      patch: `${patchDate} · ${label}`,
    };
  });
}
