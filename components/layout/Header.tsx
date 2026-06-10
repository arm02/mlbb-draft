"use client";

import { useState, useCallback } from "react";
import { Trash2, HelpCircle, Settings, RefreshCw } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { cn } from "@/lib/utils";
import useSWRMutation from "swr/mutation";

async function postRefresh(url: string) {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function Header() {
  const clearAll = useDraftStore((s) => s.clearAll);
  const [patchLabel, setPatchLabel] = useState("1.9.10");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { trigger, isMutating } = useSWRMutation("/api/refresh", postRefresh);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const result = await trigger();
      setPatchLabel(new Date().toISOString().slice(0, 10));
      showToast(`✓ Updated ${result.total} heroes — ${result.imagesUpdated} images refreshed`);
      // Reload the page so SWR picks up fresh heroes.json
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast("✗ Refresh failed — check console");
    }
  }, [trigger, showToast]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xl text-primary tracking-wide select-none">
            MLBB
          </span>
          <span className="font-display font-semibold text-xl text-text-primary tracking-wide select-none">
            Draft
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-muted font-mono">
            patch {patchLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Refresh data button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isMutating}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
              "text-primary border border-primary/30 bg-primary/5",
              "hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Refresh hero images from MLBB wiki"
          >
            <RefreshCw
              size={13}
              className={isMutating ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {isMutating ? "Refreshing…" : "Refresh Data"}
            </span>
          </button>

          <button
            type="button"
            onClick={clearAll}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
              "text-danger border border-danger/30 bg-danger/5",
              "hover:bg-danger/15 transition-colors"
            )}
            title="Reset all draft selections"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Reset Draft</span>
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
            title="Help"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
            "px-3 py-2 rounded-lg text-xs font-medium shadow-lg",
            "bg-surface border border-border text-text-primary",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {toastMsg}
        </div>
      )}
    </header>
  );
}
