import type { Hero } from "@/lib/types";

export function getPatchLabel(heroes: Hero[]): string {
  if (!heroes.length) return "—";
  const patches = [...new Set(heroes.map((h) => h.patch).filter(Boolean))];
  if (patches.length === 1) return patches[0];
  return patches[0] ?? "—";
}
