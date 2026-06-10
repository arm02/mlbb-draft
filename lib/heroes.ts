import type { Hero } from "@/lib/types";

let cachedHeroes: Hero[] | null = null;

export async function getHeroes(): Promise<Hero[]> {
  if (cachedHeroes) return cachedHeroes;

  const res = await fetch("/data/heroes.json");
  if (!res.ok) throw new Error("Failed to load heroes data");
  const data: Hero[] = await res.json();
  cachedHeroes = data;
  return data;
}

export function getHeroById(heroes: Hero[], id: string): Hero | undefined {
  return heroes.find((h) => h.id === id);
}

export function filterHeroes(heroes: Hero[], query: string): Hero[] {
  if (!query.trim()) return heroes;
  const lower = query.toLowerCase();
  return heroes.filter(
    (h) =>
      h.name.toLowerCase().includes(lower) ||
      h.role.some((r) => r.toLowerCase().includes(lower)) ||
      h.lane.some((l) => l.toLowerCase().includes(lower))
  );
}

export function tierToScore(tier: Hero["tier"]): number {
  const map: Record<Hero["tier"], number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  return map[tier];
}
