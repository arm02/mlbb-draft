export type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";
export type Lane = "Exp" | "Gold" | "Mid" | "Jungle" | "Roam";
export type Tier = "S" | "A" | "B" | "C" | "D";
export type TabId = "counter" | "winrate" | "ban" | "compare" | "draftsim";

export interface Hero {
  id: string;
  name: string;
  role: HeroRole[];
  lane: Lane[];
  specialty: string[];
  tier: Tier;
  winRate: number;
  pickRate: number;
  banRate: number;
  counters: string[];
  counteredBy: string[];
  strongAgainst: string[];
  weakAgainst: string[];
  image: string;
  patch: string;
}

export interface CounterResult {
  hero: Hero;
  score: number;
  countersCount: number;
  countersWhich: string[];
}

export interface TeamAnalysis {
  avgWinRate: number;
  avgTierScore: number;
  roles: HeroRole[];
  missingRoles: HeroRole[];
  estimatedWinRate: number;
}

export interface BanCandidate {
  hero: Hero;
  banScore: number;
  reason: string;
}
