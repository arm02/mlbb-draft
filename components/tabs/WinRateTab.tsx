"use client";

import { useMemo } from "react";
import { AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import { useDraftStore } from "@/store/useDraftStore";
import { HeroGrid } from "@/components/ui/HeroGrid";
import { WinMeter } from "@/components/ui/WinMeter";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import {
  estimateWinRate,
  getMissingRoles,
  getAvgTierScore,
} from "@/lib/winrate";
import { getHeroById } from "@/lib/heroes";
import type { Hero } from "@/lib/types";

interface WinRateTabProps {
  heroes: Hero[];
}

export function WinRateTab({ heroes }: WinRateTabProps) {
  const myTeam = useDraftStore((s) => s.myTeam);
  const enemyTeam = useDraftStore((s) => s.enemyTeam);
  const addToMyTeam = useDraftStore((s) => s.addToMyTeam);
  const removeFromMyTeam = useDraftStore((s) => s.removeFromMyTeam);
  const addToEnemyTeam = useDraftStore((s) => s.addToEnemyTeam);
  const removeFromEnemyTeam = useDraftStore((s) => s.removeFromEnemyTeam);

  const myHeroes = useMemo(
    () => myTeam.map((id) => getHeroById(heroes, id)).filter(Boolean) as Hero[],
    [heroes, myTeam]
  );
  const enemyHeroes = useMemo(
    () => enemyTeam.map((id) => getHeroById(heroes, id)).filter(Boolean) as Hero[],
    [heroes, enemyTeam]
  );

  const winRate = useMemo(
    () => estimateWinRate(myHeroes, enemyHeroes),
    [myHeroes, enemyHeroes]
  );

  const missingRoles = useMemo(() => getMissingRoles(myHeroes), [myHeroes]);
  const avgTierScore = useMemo(() => getAvgTierScore(myHeroes), [myHeroes]);

  const allSelected = [...myTeam, ...enemyTeam];

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-5">
      {/* Two-column team pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Team */}
        <TeamPanel
          title="My Team"
          accent="primary"
          pickedIds={myTeam}
          heroes={heroes}
          allSelected={allSelected}
          onAdd={addToMyTeam}
          onRemove={removeFromMyTeam}
          placeholder="Add your hero picks…"
        />

        {/* Enemy Team */}
        <TeamPanel
          title="Enemy Team"
          accent="danger"
          pickedIds={enemyTeam}
          heroes={heroes}
          allSelected={allSelected}
          onAdd={addToEnemyTeam}
          onRemove={removeFromEnemyTeam}
          placeholder="Add enemy hero picks…"
        />
      </div>

      {/* Analysis */}
      {myHeroes.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-text-muted">
            Analysis
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <WinMeter value={winRate} />

            <div className="flex-1 space-y-3 w-full">
              {/* Avg tier */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Team avg tier score</span>
                <span className="font-semibold text-warning">
                  {avgTierScore.toFixed(1)} / 5.0
                </span>
              </div>

              {/* Hero win rates */}
              <div className="space-y-1.5">
                {myHeroes.map((hero) => (
                  <HeroWinBar key={hero.id} hero={hero} />
                ))}
              </div>

              {/* Missing roles warning */}
              {missingRoles.length > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-warning">
                    <strong>Missing roles:</strong>{" "}
                    {missingRoles.join(", ")}
                  </div>
                </div>
              )}

              {/* Team composition */}
              <div className="flex flex-wrap gap-1">
                {myHeroes.flatMap((h) =>
                  h.role.map((r) => <RoleBadge key={`${h.id}-${r}`} role={r} />)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TeamPanelProps {
  title: string;
  accent: "primary" | "danger";
  pickedIds: string[];
  heroes: Hero[];
  allSelected: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
}

function TeamPanel({
  title,
  accent,
  pickedIds,
  heroes,
  allSelected,
  onAdd,
  onRemove,
  placeholder,
}: TeamPanelProps) {
  const accentColor = accent === "primary" ? "text-primary" : "text-danger";
  const borderAccent =
    accent === "primary" ? "border-primary/30" : "border-danger/30";

  const pickedHeroes = pickedIds
    .map((id) => heroes.find((h) => h.id === id))
    .filter(Boolean) as Hero[];

  const handleToggle = (hero: Hero) => {
    if (pickedIds.includes(hero.id)) {
      onRemove(hero.id);
    } else {
      onAdd(hero.id);
    }
  };

  return (
    <div className={`bg-surface border ${borderAccent} rounded-xl p-3 space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-bold font-display uppercase tracking-wider ${accentColor}`}>
          {title}
        </h3>
        <span className="text-[10px] text-text-muted">{pickedIds.length}/5</span>
      </div>

      {/* Picked chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {pickedHeroes.length === 0 ? (
          <span className="text-text-muted text-xs">{placeholder}</span>
        ) : (
          pickedHeroes.map((hero) => (
            <div
              key={hero.id}
              className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 bg-background border border-border rounded-full"
            >
              <Image
                src={hero.image}
                alt={hero.name}
                width={20}
                height={20}
                className="rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
                }}
              />
              <span className="text-[11px] font-medium">{hero.name}</span>
              <button
                type="button"
                onClick={() => onRemove(hero.id)}
                className="text-text-muted hover:text-danger ml-0.5"
              >
                <X size={10} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Grid */}
      <HeroGrid
        heroes={heroes}
        selectedIds={pickedIds}
        disabledIds={allSelected.filter((id) => !pickedIds.includes(id))}
        onSelect={handleToggle}
        maxSelect={5}
        size="sm"
        showSearch={false}
      />
    </div>
  );
}

interface HeroWinBarProps {
  hero: Hero;
}

function HeroWinBar({ hero }: HeroWinBarProps) {
  const pct = Math.min(100, hero.winRate);
  const color =
    pct >= 52 ? "#34D399" : pct >= 49 ? "#4F8EF7" : "#F87171";

  return (
    <div className="flex items-center gap-2 text-xs">
      <TierBadge tier={hero.tier} />
      <span className="w-20 truncate font-display font-semibold">{hero.name}</span>
      <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span style={{ color }} className="w-10 text-right font-medium">
        {hero.winRate.toFixed(1)}%
      </span>
    </div>
  );
}
