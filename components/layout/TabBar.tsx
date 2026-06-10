"use client";

import { Shield, TrendingUp, Ban, BarChart2, Swords } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { cn } from "@/lib/utils";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: "draftsim", label: "Draft Simulator", shortLabel: "Draft", icon: <Swords size={15} /> },
  { id: "counter", label: "Counter Picker", shortLabel: "Counter", icon: <Shield size={15} /> },
  { id: "winrate", label: "Win Rate", shortLabel: "Win Rate", icon: <TrendingUp size={15} /> },
  { id: "ban", label: "Ban Recommender", shortLabel: "Ban", icon: <Ban size={15} /> },
  { id: "compare", label: "Hero Compare", shortLabel: "Compare", icon: <BarChart2 size={15} /> },
];

interface TabBarProps {
  mobile?: boolean;
}

export function TabBar({ mobile = false }: TabBarProps) {
  const activeTab = useDraftStore((s) => s.activeTab);
  const setTab = useDraftStore((s) => s.setTab);

  if (mobile) {
    return (
      <nav className="bg-surface border-t border-border">
        <div className="flex items-stretch">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors",
                activeTab === tab.id
                  ? "text-primary bg-primary/5"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <span className="flex items-center justify-center">{tab.icon}</span>
              <span className="text-[10px] font-medium truncate w-full text-center px-0.5">
                {tab.shortLabel}
              </span>
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex-1 min-w-0 flex p-1 gap-0.5 rounded-xl bg-surface border border-border overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setTab(tab.id)}
          title={tab.label}
          className={cn(
            "flex-1 min-w-[4.5rem] flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
            activeTab === tab.id
              ? "bg-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-background/60"
          )}
        >
          {tab.icon}
          <span>{tab.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}
