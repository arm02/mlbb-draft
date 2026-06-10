import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/types";

const tierStyles: Record<Tier, string> = {
  S: "bg-purple-600/20 text-purple-300 border-purple-600/40",
  A: "bg-primary/20 text-primary border-primary/40",
  B: "bg-success/20 text-success border-success/40",
  C: "bg-warning/20 text-warning border-warning/40",
  D: "bg-danger/20 text-danger border-danger/40",
};

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 text-xs font-bold font-display border rounded",
        tierStyles[tier],
        className
      )}
    >
      {tier}
    </span>
  );
}
