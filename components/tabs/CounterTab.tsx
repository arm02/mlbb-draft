"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useDraftStore } from "@/store/useDraftStore";
import { HeroGrid } from "@/components/ui/HeroGrid";
import { HeroCard } from "@/components/ui/HeroCard";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { getBestCounters } from "@/lib/counter";
import { getHeroById } from "@/lib/heroes";
import type { Hero } from "@/lib/types";

interface CounterTabProps {
  heroes: Hero[];
}

export function CounterTab({ heroes }: CounterTabProps) {
  const enemyPicks = useDraftStore((s) => s.enemyPicks);
  const addEnemyPick = useDraftStore((s) => s.addEnemyPick);
  const removeEnemyPick = useDraftStore((s) => s.removeEnemyPick);

  const counterResults = useMemo(
    () => getBestCounters(heroes, enemyPicks, 10),
    [heroes, enemyPicks]
  );

  const handleSelect = (hero: Hero) => {
    if (enemyPicks.includes(hero.id)) {
      removeEnemyPick(hero.id);
    } else {
      addEnemyPick(hero.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-5">
      {/* Enemy picks chips */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Enemy Team
          </h2>
          <span className="text-xs text-text-muted">
            ({enemyPicks.length}/5 selected)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {enemyPicks.length === 0 ? (
            <p className="text-text-muted text-xs py-2">
              Select enemy heroes below…
            </p>
          ) : (
            enemyPicks.map((id) => {
              const hero = getHeroById(heroes, id);
              if (!hero) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-surface border border-border rounded-full"
                >
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
                    }}
                  />
                  <span className="text-xs font-medium">{hero.name}</span>
                  <button
                    type="button"
                    onClick={() => removeEnemyPick(id)}
                    className="text-text-muted hover:text-danger transition-colors ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hero selection grid */}
      <div>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Select Enemy Heroes
        </h2>
        <HeroGrid
          heroes={heroes}
          selectedIds={enemyPicks}
          onSelect={handleSelect}
          maxSelect={5}
          autoFocus
          size="sm"
        />
      </div>

      {/* Counter results */}
      {enemyPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold font-display text-text-primary">
              Best Counters
            </h2>
            {enemyPicks.length >= 3 && (
              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Team Counter Score
              </span>
            )}
          </div>

          {counterResults.length === 0 ? (
            <p className="text-text-muted text-sm">
              No direct counter data found. Try selecting different heroes.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {counterResults.map(({ hero, score, countersWhich }) => (
                <CounterCard
                  key={hero.id}
                  hero={hero}
                  score={score}
                  countersWhich={countersWhich}
                  allHeroes={heroes}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CounterCardProps {
  hero: Hero;
  score: number;
  countersWhich: string[];
  allHeroes: Hero[];
}

function CounterCard({ hero, score, countersWhich, allHeroes }: CounterCardProps) {
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-2.5 hover:border-primary/30 transition-colors">
      <div className="relative flex-shrink-0">
        <Image
          src={hero.image}
          alt={hero.name}
          width={48}
          height={48}
          className="rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
          }}
        />
        <div className="absolute -top-1 -right-1">
          <TierBadge tier={hero.tier} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display font-semibold text-sm">{hero.name}</span>
          {hero.role.slice(0, 1).map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="text-success">WR {hero.winRate.toFixed(1)}%</span>
          <span>Pick {hero.pickRate.toFixed(1)}%</span>
        </div>

        {countersWhich.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {countersWhich.map((eid) => {
              const enemy = getHeroById(allHeroes, eid);
              return enemy ? (
                <span
                  key={eid}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20"
                >
                  Counters {enemy.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
        <div className="w-8 h-8 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
          <span className="text-success font-bold text-sm">{score}</span>
        </div>
        <span className="text-[9px] text-text-muted">score</span>
      </div>
    </div>
  );
}
