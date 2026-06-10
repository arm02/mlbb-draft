"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useDraftStore } from "@/store/useDraftStore";
import { Header } from "@/components/layout/Header";
import { AppNav } from "@/components/layout/AppNav";
import { TabBar } from "@/components/layout/TabBar";
import { CounterTab } from "@/components/tabs/CounterTab";
import { WinRateTab } from "@/components/tabs/WinRateTab";
import { BanTab } from "@/components/tabs/BanTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import { DraftSimTab } from "@/components/tabs/DraftSimTab";
import { mergeHeroStats } from "@/lib/hero-stats";
import type { RankHeroStats } from "@/lib/mlbb-rank-stats";
import type { Hero } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatsResponse {
  stats: Record<string, RankHeroStats>;
}

export default function HomePage() {
  const activeTab = useDraftStore((s) => s.activeTab);
  const statsMode = useDraftStore((s) => s.statsMode);
  const statsRank = useDraftStore((s) => s.statsRank);

  const { data: heroes = [], isLoading } = useSWR<Hero[]>(
    "/data/heroes.json",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const statsUrl =
    statsMode === "pro"
      ? "/api/stats?mode=pro"
      : `/api/stats?mode=rank&rank=${encodeURIComponent(statsRank)}`;

  const { data: rankStats } = useSWR<StatsResponse>(statsUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const heroesWithStats = useMemo(
    () => mergeHeroStats(heroes, rankStats?.stats, statsMode, statsRank),
    [heroes, rankStats?.stats, statsMode, statsRank]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <AppNav />

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted text-sm animate-pulse">Loading hero data…</div>
          </div>
        ) : (
          <>
            {activeTab === "counter" && <CounterTab heroes={heroesWithStats} />}
            {activeTab === "winrate" && <WinRateTab heroes={heroesWithStats} />}
            {activeTab === "ban" && <BanTab heroes={heroesWithStats} />}
            {activeTab === "compare" && <CompareTab heroes={heroesWithStats} />}
            {activeTab === "draftsim" && <DraftSimTab heroes={heroesWithStats} />}
          </>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <TabBar mobile />
      </div>
    </div>
  );
}
