"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import type { Hero } from "@/lib/types";

interface HeroCardProps {
  hero: Hero;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  showStats?: boolean;
  className?: string;
}

export function HeroCard({
  hero,
  selected = false,
  dimmed = false,
  onClick,
  size = "md",
  showStats = false,
  className,
}: HeroCardProps) {
  const imgSize = size === "sm" ? 48 : 64;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border transition-all duration-150 hero-card-glow",
        size === "sm" ? "p-1.5 w-[72px]" : "p-2 w-[88px]",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_12px_rgba(79,142,247,0.5)]"
          : "border-border bg-surface hover:border-primary/50",
        dimmed && "opacity-40",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      <div className="relative rounded overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.name}
          width={imgSize}
          height={imgSize}
          loading="lazy"
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
          }}
        />
        <div className="absolute top-0.5 right-0.5">
          <TierBadge tier={hero.tier} className="w-5 h-5 text-[9px]" />
        </div>
      </div>

      <span
        className={cn(
          "text-center font-display font-semibold leading-tight truncate w-full",
          size === "sm" ? "text-[10px]" : "text-xs"
        )}
      >
        {hero.name}
      </span>

      <div className="flex flex-wrap gap-0.5 justify-center">
        {hero.role.slice(0, 1).map((r) => (
          <RoleBadge key={r} role={r} />
        ))}
      </div>

      {showStats && (
        <div className="text-[9px] text-text-muted mt-0.5 space-y-0.5 w-full">
          <div className="flex justify-between">
            <span>WR</span>
            <span className="text-success">{hero.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Ban</span>
            <span className="text-danger">{hero.banRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-primary pointer-events-none" />
      )}
    </button>
  );
}
