"use client";

import { ChevronDown } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { RANK_OPTIONS, type RankFilter } from "@/lib/ranks";
import { cn } from "@/lib/utils";

interface RankSelectorProps {
  compact?: boolean;
}

export function RankSelector({ compact = false }: RankSelectorProps) {
  const statsMode = useDraftStore((s) => s.statsMode);
  const statsRank = useDraftStore((s) => s.statsRank);
  const setStatsMode = useDraftStore((s) => s.setStatsMode);
  const setStatsRank = useDraftStore((s) => s.setStatsRank);

  return (
    <div className={cn("flex items-center gap-2", compact ? "shrink-0" : "flex-wrap")}>
      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
        <button
          type="button"
          onClick={() => setStatsMode("rank")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
            statsMode === "rank"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Rank
        </button>
        <button
          type="button"
          onClick={() => setStatsMode("pro")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
            statsMode === "pro"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Pro
        </button>
      </div>

      {statsMode === "rank" && (
        <div className="relative">
          <select
            value={statsRank}
            onChange={(e) => setStatsRank(e.target.value as RankFilter)}
            className={cn(
              "appearance-none pl-2.5 pr-7 py-1.5 rounded-lg text-xs font-medium max-w-[9.5rem]",
              "bg-surface border border-border text-text-primary",
              "hover:border-primary/40 focus:outline-none focus:border-primary/60"
            )}
          >
            {RANK_OPTIONS.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
