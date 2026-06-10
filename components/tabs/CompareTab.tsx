"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useDraftStore } from "@/store/useDraftStore";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { filterHeroes, getHeroById } from "@/lib/heroes";
import { cn } from "@/lib/utils";
import type { Hero } from "@/lib/types";

interface CompareTabProps {
  heroes: Hero[];
}

export function CompareTab({ heroes }: CompareTabProps) {
  const compareA = useDraftStore((s) => s.compareA);
  const compareB = useDraftStore((s) => s.compareB);
  const setCompareA = useDraftStore((s) => s.setCompareA);
  const setCompareB = useDraftStore((s) => s.setCompareB);

  const heroA = compareA ? getHeroById(heroes, compareA) : null;
  const heroB = compareB ? getHeroById(heroes, compareB) : null;

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-5">
      {/* Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HeroPicker
          label="Hero A"
          heroes={heroes}
          selected={heroA ?? null}
          onSelect={(h) => setCompareA(h?.id ?? null)}
          accentClass="border-primary/40"
        />
        <HeroPicker
          label="Hero B"
          heroes={heroes}
          selected={heroB ?? null}
          onSelect={(h) => setCompareB(h?.id ?? null)}
          accentClass="border-warning/40"
        />
      </div>

      {/* Comparison table */}
      {heroA && heroB && (
        <CompareTable heroA={heroA} heroB={heroB} />
      )}

      {(!heroA || !heroB) && (
        <div className="text-center text-text-muted text-sm py-8">
          Select two heroes above to compare them side by side.
        </div>
      )}
    </div>
  );
}

interface HeroPickerProps {
  label: string;
  heroes: Hero[];
  selected: Hero | null;
  onSelect: (hero: Hero | null) => void;
  accentClass: string;
}

function HeroPicker({ label, heroes, selected, onSelect, accentClass }: HeroPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => filterHeroes(heroes, query).slice(0, 8),
    [heroes, query]
  );

  return (
    <div className={`bg-surface border ${accentClass} rounded-xl p-3 space-y-2`}>
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</h3>

      {selected ? (
        <div className="flex items-center gap-3">
          <Image
            src={selected.image}
            alt={selected.name}
            width={56}
            height={56}
            className="rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base">{selected.name}</span>
              <TierBadge tier={selected.tier} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {selected.role.map((r) => <RoleBadge key={r} role={r} />)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery(""); setOpen(false); }}
            className="text-xs text-text-muted hover:text-danger px-2 py-1 rounded"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <HeroSearch
            value={query}
            onChange={(v) => { setQuery(v); setOpen(true); }}
            placeholder="Search hero…"
            autoFocus={false}
          />
          {open && query && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg overflow-hidden z-20 shadow-xl">
              {filtered.map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => {
                    onSelect(hero);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-border/50 transition-colors text-left"
                >
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    width={28}
                    height={28}
                    className="rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
                    }}
                  />
                  <span className="text-sm font-medium">{hero.name}</span>
                  <TierBadge tier={hero.tier} className="ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CompareTableProps {
  heroA: Hero;
  heroB: Hero;
}

interface StatRow {
  label: string;
  a: string | number;
  b: string | number;
  higherIsBetter: boolean;
}

function CompareTable({ heroA, heroB }: CompareTableProps) {
  const aCountersB = heroA.strongAgainst.includes(heroB.id);
  const bCountersA = heroB.strongAgainst.includes(heroA.id);

  const stats: StatRow[] = [
    { label: "Win Rate", a: heroA.winRate, b: heroB.winRate, higherIsBetter: true },
    { label: "Pick Rate", a: heroA.pickRate, b: heroB.pickRate, higherIsBetter: true },
    { label: "Ban Rate", a: heroA.banRate, b: heroB.banRate, higherIsBetter: false },
    { label: "Tier", a: heroA.tier, b: heroB.tier, higherIsBetter: true },
  ];

  const tierOrder: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

  function getWinner(row: StatRow): "a" | "b" | "tie" {
    const av = typeof row.a === "string" ? (tierOrder[row.a] ?? 0) : (row.a as number);
    const bv = typeof row.b === "string" ? (tierOrder[row.b] ?? 0) : (row.b as number);
    if (av === bv) return "tie";
    const aWins = row.higherIsBetter ? av > bv : av < bv;
    return aWins ? "a" : "b";
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Hero headers */}
      <div className="grid grid-cols-3 gap-0 border-b border-border">
        <HeroHeader hero={heroA} accent="#4F8EF7" />
        <div className="flex items-center justify-center text-text-muted font-display font-bold text-lg border-x border-border py-3">
          VS
        </div>
        <HeroHeader hero={heroB} accent="#FBBF24" />
      </div>

      {/* Stats */}
      {stats.map((row) => {
        const winner = getWinner(row);
        return (
          <div key={row.label} className="grid grid-cols-3 border-b border-border last:border-0">
            <StatCell
              value={typeof row.a === "number" ? `${row.a.toFixed(1)}%` : String(row.a)}
              highlight={winner === "a"}
            />
            <div className="flex items-center justify-center text-[10px] text-text-muted uppercase tracking-wider border-x border-border py-2">
              {row.label}
            </div>
            <StatCell
              value={typeof row.b === "number" ? `${row.b.toFixed(1)}%` : String(row.b)}
              highlight={winner === "b"}
              right
            />
          </div>
        );
      })}

      {/* Roles */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="flex flex-wrap gap-1 p-2 justify-center">
          {heroA.role.map((r) => <RoleBadge key={r} role={r} />)}
        </div>
        <div className="flex items-center justify-center text-[10px] text-text-muted uppercase tracking-wider border-x border-border py-2">
          Roles
        </div>
        <div className="flex flex-wrap gap-1 p-2 justify-center">
          {heroB.role.map((r) => <RoleBadge key={r} role={r} />)}
        </div>
      </div>

      {/* Lanes */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="flex flex-wrap gap-1 p-2 justify-center">
          {heroA.lane.map((l) => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-border text-text-muted">{l}</span>
          ))}
        </div>
        <div className="flex items-center justify-center text-[10px] text-text-muted uppercase tracking-wider border-x border-border py-2">
          Lanes
        </div>
        <div className="flex flex-wrap gap-1 p-2 justify-center">
          {heroB.lane.map((l) => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-border text-text-muted">{l}</span>
          ))}
        </div>
      </div>

      {/* 1v1 verdict */}
      <div className="p-3 flex items-center justify-center gap-3 bg-background/50">
        <span className="text-xs text-text-muted">1v1 Verdict:</span>
        {aCountersB && !bCountersA && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
            {heroA.name} counters {heroB.name} ✓
          </span>
        )}
        {bCountersA && !aCountersB && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-danger/15 text-danger border border-danger/30">
            {heroB.name} counters {heroA.name} ✓
          </span>
        )}
        {aCountersB && bCountersA && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/30">
            Even matchup
          </span>
        )}
        {!aCountersB && !bCountersA && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-border text-text-muted">
            No direct counter
          </span>
        )}
      </div>
    </div>
  );
}

function HeroHeader({ hero, accent }: { hero: Hero; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3">
      <Image
        src={hero.image}
        alt={hero.name}
        width={52}
        height={52}
        className="rounded-lg object-cover"
        style={{ boxShadow: `0 0 12px ${accent}40` }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
        }}
      />
      <span className="font-display font-bold text-sm text-center">{hero.name}</span>
    </div>
  );
}

function StatCell({
  value,
  highlight,
  right = false,
}: {
  value: string;
  highlight: boolean;
  right?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center py-2 px-3 text-sm font-semibold",
        right ? "justify-end" : "justify-start",
        highlight ? "text-success bg-success/5" : "text-text-primary"
      )}
    >
      {highlight && !right && (
        <span className="w-1.5 h-1.5 rounded-full bg-success mr-2 flex-shrink-0" />
      )}
      {value}
      {highlight && right && (
        <span className="w-1.5 h-1.5 rounded-full bg-success ml-2 flex-shrink-0" />
      )}
    </div>
  );
}
