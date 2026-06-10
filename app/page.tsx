"use client";

import useSWR from "swr";
import { useDraftStore } from "@/store/useDraftStore";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { CounterTab } from "@/components/tabs/CounterTab";
import { WinRateTab } from "@/components/tabs/WinRateTab";
import { BanTab } from "@/components/tabs/BanTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import { DraftSimTab } from "@/components/tabs/DraftSimTab";
import type { Hero } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const activeTab = useDraftStore((s) => s.activeTab);

  const { data: heroes = [], isLoading } = useSWR<Hero[]>(
    "/data/heroes.json",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Desktop tab bar */}
      <div className="hidden md:block sticky top-0 z-40 bg-background border-b border-border">
        <TabBar />
      </div>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted text-sm animate-pulse">Loading hero data…</div>
          </div>
        ) : (
          <>
            {activeTab === "counter" && <CounterTab heroes={heroes} />}
            {activeTab === "winrate" && <WinRateTab heroes={heroes} />}
            {activeTab === "ban" && <BanTab heroes={heroes} />}
            {activeTab === "compare" && <CompareTab heroes={heroes} />}
            {activeTab === "draftsim" && <DraftSimTab heroes={heroes} />}
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
