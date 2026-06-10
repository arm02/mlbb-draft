import type { Hero, HeroRole, BanCandidate } from "@/lib/types";
import { tierToScore } from "@/lib/heroes";

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function estimateWinRate(myTeam: Hero[], enemyTeam: Hero[]): number {
  if (!myTeam.length) return 50;

  const myAvg = average(myTeam.map((h) => h.winRate));
  const enemyAvg = enemyTeam.length
    ? average(enemyTeam.map((h) => h.winRate))
    : 50;

  const counterBonus = myTeam.reduce((acc, hero) => {
    return (
      acc +
      enemyTeam.filter((e) => hero.strongAgainst.includes(e.id)).length * 1.5
    );
  }, 0);

  const counterPenalty = myTeam.reduce((acc, hero) => {
    return (
      acc +
      enemyTeam.filter((e) => e.strongAgainst.includes(hero.id)).length * 1.5
    );
  }, 0);

  return clamp(myAvg - enemyAvg + 50 + counterBonus - counterPenalty, 20, 80);
}

export function getTeamRoles(team: Hero[]): HeroRole[] {
  const roles = new Set<HeroRole>();
  team.forEach((h) => h.role.forEach((r) => roles.add(r)));
  return Array.from(roles);
}

export const CORE_ROLES: HeroRole[] = ["Tank", "Marksman", "Mage"];

export function getMissingRoles(team: Hero[]): HeroRole[] {
  const roles = getTeamRoles(team);
  return CORE_ROLES.filter((r) => !roles.includes(r));
}

export function getAvgTierScore(team: Hero[]): number {
  if (!team.length) return 0;
  return average(team.map((h) => tierToScore(h.tier)));
}

export function getBanCandidates(heroes: Hero[], limit?: number): BanCandidate[] {
  const reasonMap: Record<string, string> = {
    fanny: "High mobility, impossible to catch",
    ling: "Wall-jump makes him untargetable",
    beatrix: "Multi-weapon burst damage",
    valentina: "Steals enemy ultimates",
    atlas: "AoE chain ult devastates teamfights",
    khufra: "Completely shuts down dashes",
    mathilda: "Provides free escapes for allies",
    chou: "Unstoppable kick combo",
    kagura: "Umbrella reset burst potential",
    yve: "Slows entire map with ult",
    esmeralda: "Shield farming makes her unkillable",
    gusion: "Combo burst kills squishies instantly",
    benedetta: "Iframe spam is frustrating to play against",
    paquito: "Reset punches snowball hard",
    lancelot: "Iframe dashes dodge all CC",
    lesley: "Long-range snipe finisher",
    karina: "Executes low-HP targets easily",
    diggie: "Anti-CC ult ruins engage comps",
    moskov: "Wall-pin crowd control poke",
    tigreal: "Reliable AOE initiation",
  };

  const ranked = heroes
    .map((hero) => ({
      hero,
      banScore: hero.banRate * 0.6 + hero.winRate * 0.4,
      reason: reasonMap[hero.id] ?? "Strong this patch",
    }))
    .sort((a, b) => b.banScore - a.banScore);

  return limit ? ranked.slice(0, limit) : ranked;
}
