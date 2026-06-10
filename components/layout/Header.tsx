"use client";

import { useState, useCallback, useMemo } from "react";
import { Trash2, HelpCircle, Settings, RefreshCw, X } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { cn } from "@/lib/utils";
import { getPatchLabel } from "@/lib/patch";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import type { Hero } from "@/lib/types";

async function postRefresh(_url: string, { arg }: { arg: string }) {
  const res = await fetch("/api/refresh", {
    method: "POST",
    headers: { "x-refresh-password": arg },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Refresh failed" }));
    throw new Error(body.error ?? "Refresh failed");
  }
  return res.json();
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
};

export function Header() {
  const clearAll = useDraftStore((s) => s.clearAll);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");

  const { data: heroes = [] } = useSWR<Hero[]>("/api/heroes", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const patchLabel = useMemo(() => getPatchLabel(heroes), [heroes]);

  const { trigger, isMutating } = useSWRMutation("/api/refresh", postRefresh);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setPassword("");
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!password.trim()) {
      showToast("✗ Password required");
      return;
    }

    try {
      const result = await trigger(password);
      closePasswordModal();
      const msg =
        result.mode === "vercel-fast"
          ? `✓ Rank stats updated (${result.rankStatsRefreshedAt?.slice(0, 10) ?? "ok"})`
          : `✓ Stats ${result.statsUpdated}/${result.total} · ranks · images ${result.imagesUpdated}`;
      showToast(msg);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Refresh failed";
      showToast(msg === "Unauthorized" ? "✗ Wrong password" : `✗ ${msg}`);
    }
  }, [password, trigger, showToast, closePasswordModal]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold text-xl text-primary tracking-wide select-none">
            MLBB
          </span>
          <span className="font-display font-semibold text-xl text-text-primary tracking-wide select-none">
            Draft
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-muted font-mono truncate max-w-[10rem]">
            patch {patchLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            disabled={isMutating}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
              "text-primary border border-primary/30 bg-primary/5",
              "hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Refresh stats from mlbb.gg (password required)"
          >
            <RefreshCw size={13} className={isMutating ? "animate-spin" : ""} />
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

      {toastMsg && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
            "px-3 py-2 rounded-lg text-xs font-medium shadow-lg",
            "bg-surface border border-border text-text-primary"
          )}
        >
          {toastMsg}
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-xl"
            role="dialog"
            aria-labelledby="refresh-password-title"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 id="refresh-password-title" className="text-sm font-semibold font-display">
                Refresh Data
              </h2>
              <button
                type="button"
                onClick={closePasswordModal}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-text-muted">
                Enter password to sync stats, ranks, and images from mlbb.gg.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
                placeholder="Password"
                autoFocus
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-background border border-border text-text-primary",
                  "placeholder:text-text-muted focus:outline-none focus:border-primary/60"
                )}
              />
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
              <button
                type="button"
                onClick={closePasswordModal}
                className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isMutating || !password.trim()}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-primary text-white hover:bg-primary/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isMutating ? "Refreshing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
