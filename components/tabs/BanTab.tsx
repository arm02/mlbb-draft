"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { getBanCandidates } from "@/lib/winrate";
import { getPatchLabel } from "@/lib/patch";
import { useDraftStore } from "@/store/useDraftStore";
import { getStatsLabel } from "@/lib/ranks";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import type { Hero, HeroRole } from "@/lib/types";

interface BanTabProps {
  heroes: Hero[];
}

type BanFilter = "all" | HeroRole | "op";

const FILTER_OPTIONS: { id: BanFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "op", label: "OP This Patch" },
  { id: "Tank", label: "Tank" },
  { id: "Fighter", label: "Fighter" },
  { id: "Assassin", label: "Assassin" },
  { id: "Mage", label: "Mage" },
  { id: "Marksman", label: "Marksman" },
  { id: "Support", label: "Support" },
];

export function BanTab({ heroes }: BanTabProps) {
  const [filter, setFilter] = useState<BanFilter>("all");
  const statsMode = useDraftStore((s) => s.statsMode);
  const statsRank = useDraftStore((s) => s.statsRank);

  const banCandidates = useMemo(() => getBanCandidates(heroes), [heroes]);
  const patchLabel = useMemo(() => getPatchLabel(heroes), [heroes]);
  const rankLabel = getStatsLabel(statsMode, statsRank);

  const filtered = useMemo(() => {
    if (filter === "all") return banCandidates;
    if (filter === "op") return banCandidates.filter((c) => c.hero.tier === "S");
    return banCandidates.filter((c) => c.hero.role.includes(filter as HeroRole));
  }, [banCandidates, filter]);

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold font-display">Ban Recommender</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {rankLabel} · {heroes.length} heroes · ban rate × 0.6 + win rate × 0.4
          </p>
        </div>
        <span className="text-[10px] text-text-muted bg-surface border border-border px-2 py-1 rounded">
          {patchLabel}
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={[
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              filter === opt.id
                ? "bg-primary text-white"
                : "bg-surface border border-border text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ban list */}
      <div className="space-y-2">
        {filtered.map(({ hero, banScore, reason }, idx) => (
          <BanRow key={hero.id} hero={hero} rank={idx + 1} banScore={banScore} reason={reason} />
        ))}

        {filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">
            No heroes match the selected filter.
          </p>
        )}
      </div>
    </div>
  );
}

interface BanRowProps {
  hero: Hero;
  rank: number;
  banScore: number;
  reason: string;
}

function BanRow({ hero, rank, banScore, reason }: BanRowProps) {
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-2.5 hover:border-danger/30 transition-colors">
      {/* Rank */}
      <div className="w-6 text-center text-xs font-bold text-text-muted font-display">
        #{rank}
      </div>

      {/* Hero image */}
      <div className="relative flex-shrink-0">
        <Image
          src={hero.image}
          alt={hero.name}
          width={44}
          height={44}
          className="rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-semibold text-sm">{hero.name}</span>
          <TierBadge tier={hero.tier} />
          {hero.role.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-0.5 truncate">{reason}</p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right space-y-0.5">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-danger font-semibold">{hero.banRate.toFixed(1)}%</span>
            <span className="text-text-muted ml-1">ban</span>
          </div>
          <div className="text-right">
            <span className="text-success font-semibold">{hero.winRate.toFixed(1)}%</span>
            <span className="text-text-muted ml-1">wr</span>
          </div>
        </div>
        <div className="text-[10px] text-text-muted text-right">
          score: {banScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
