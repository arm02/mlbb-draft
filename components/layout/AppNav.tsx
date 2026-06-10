"use client";

import { TabBar } from "@/components/layout/TabBar";
import { RankSelector } from "@/components/ui/RankSelector";

export function AppNav() {
  return (
    <>
      {/* Desktop navigation */}
      <div className="hidden md:block sticky top-[41px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-3 py-2">
          <div className="flex items-center gap-3">
            <TabBar />
            <div className="h-8 w-px bg-border shrink-0" />
            <RankSelector compact />
          </div>
        </div>
      </div>

      {/* Mobile rank bar */}
      <div className="md:hidden sticky top-[41px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted shrink-0">
            Stats
          </span>
          <RankSelector compact />
        </div>
      </div>
    </>
  );
}
