import { cn } from "@/lib/utils";
import type { HeroRole } from "@/lib/types";

const roleStyles: Record<HeroRole, string> = {
  Tank: "bg-blue-600/20 text-blue-300",
  Fighter: "bg-orange-600/20 text-orange-300",
  Assassin: "bg-red-600/20 text-red-300",
  Mage: "bg-violet-600/20 text-violet-300",
  Marksman: "bg-yellow-600/20 text-yellow-300",
  Support: "bg-teal-600/20 text-teal-300",
};

interface RoleBadgeProps {
  role: HeroRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded",
        roleStyles[role],
        className
      )}
    >
      {role}
    </span>
  );
}
