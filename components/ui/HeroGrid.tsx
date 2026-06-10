"use client";

import { useState, useMemo, useCallback, type KeyboardEvent, useRef } from "react";
import { HeroCard } from "@/components/ui/HeroCard";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { filterHeroes } from "@/lib/heroes";
import type { Hero } from "@/lib/types";

interface HeroGridProps {
  heroes: Hero[];
  selectedIds?: string[];
  disabledIds?: string[];
  onSelect: (hero: Hero) => void;
  autoFocus?: boolean;
  maxSelect?: number;
  showSearch?: boolean;
  size?: "sm" | "md";
}

export function HeroGrid({
  heroes,
  selectedIds = [],
  disabledIds = [],
  onSelect,
  autoFocus = false,
  maxSelect,
  showSearch = true,
  size = "md",
}: HeroGridProps) {
  const [query, setQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterHeroes(heroes, query), [heroes, query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && focusIdx >= 0) {
        e.preventDefault();
        const hero = filtered[focusIdx];
        if (hero && !disabledIds.includes(hero.id)) onSelect(hero);
      } else if (e.key === "Escape") {
        setQuery("");
        setFocusIdx(-1);
      }
    },
    [filtered, focusIdx, disabledIds, onSelect]
  );

  const isDisabled = useCallback(
    (id: string) => {
      if (disabledIds.includes(id)) return true;
      if (maxSelect && selectedIds.length >= maxSelect && !selectedIds.includes(id))
        return true;
      return false;
    },
    [disabledIds, maxSelect, selectedIds]
  );

  return (
    <div className="flex flex-col gap-3">
      {showSearch && (
        <HeroSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setFocusIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
      )}

      <div
        ref={gridRef}
        className="flex flex-wrap gap-2"
        role="grid"
        aria-label="Hero selection grid"
      >
        {filtered.map((hero, idx) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            size={size}
            selected={selectedIds.includes(hero.id)}
            dimmed={isDisabled(hero.id) && !selectedIds.includes(hero.id)}
            onClick={() => {
              if (!isDisabled(hero.id)) onSelect(hero);
            }}
            className={idx === focusIdx ? "ring-2 ring-warning" : ""}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-text-muted text-sm py-4 w-full text-center">
            No heroes match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
