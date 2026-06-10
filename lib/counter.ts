import type { Hero, CounterResult } from "@/lib/types";
import { getHeroById } from "@/lib/heroes";

export function getCounterScore(hero: Hero, enemyIds: string[]): number {
  return enemyIds.filter((e) => hero.strongAgainst.includes(e)).length;
}

export function getBestCounters(
  allHeroes: Hero[],
  enemyIds: string[],
  limit = 10
): CounterResult[] {
  if (!enemyIds.length) return [];

  const excluded = new Set(enemyIds);

  return allHeroes
    .filter((h) => !excluded.has(h.id))
    .map((hero) => {
      const countersWhich = enemyIds.filter((e) => hero.strongAgainst.includes(e));
      return {
        hero,
        score: countersWhich.length,
        countersCount: countersWhich.length,
        countersWhich,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.hero.winRate - a.hero.winRate;
    })
    .slice(0, limit);
}

export function getPerHeroCounters(
  allHeroes: Hero[],
  enemyId: string,
  limit = 5
): Hero[] {
  const enemy = getHeroById(allHeroes, enemyId);
  if (!enemy) return [];

  return allHeroes
    .filter((h) => h.strongAgainst.includes(enemyId))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
}
