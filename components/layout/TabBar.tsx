"use client";

import { Shield, TrendingUp, Ban, BarChart2, Swords } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { cn } from "@/lib/utils";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { id: "draftsim", label: "Draft Simulator",    shortLabel: "Draft",    icon: <Swords size={16} /> },
  { id: "counter",  label: "Counter Picker",    shortLabel: "Counter",  icon: <Shield size={16} /> },
  { id: "winrate",  label: "Win Rate",           shortLabel: "Win Rate", icon: <TrendingUp size={16} /> },
  { id: "ban",      label: "Ban Recommender",    shortLabel: "Ban",      icon: <Ban size={16} /> },
  { id: "compare",  label: "Hero Compare",       shortLabel: "Compare",  icon: <BarChart2 size={16} /> },
];

interface TabBarProps {
  mobile?: boolean;
}

export function TabBar({ mobile = false }: TabBarProps) {
  const activeTab = useDraftStore((s) => s.activeTab);
  const setTab = useDraftStore((s) => s.setTab);

  if (mobile) {
    return (
      <nav className="bg-surface border-t border-border flex items-stretch">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] transition-colors",
              activeTab === tab.id
                ? "text-primary border-t-2 border-primary -mt-px bg-primary/5"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.icon}
            <span>{tab.shortLabel}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="max-w-5xl mx-auto px-3 flex items-center gap-1 py-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setTab(tab.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-primary/15 text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-surface"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
