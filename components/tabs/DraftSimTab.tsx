"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { RotateCcw, Clock, Sword, ShieldOff, SkipForward } from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { filterHeroes, getHeroById } from "@/lib/heroes";
import {
  getTeamBans,
  getTeamPicks,
  isHeroDisabledForSlot,
  isPickPhaseComplete,
  getUnavailableForPick,
  type DraftSlot,
  type DraftTeam,
  type DraftMode,
} from "@/lib/draft";
import { cn } from "@/lib/utils";
import type { Hero, Lane } from "@/lib/types";

const TIMER_SECONDS = 30;
const MY_TEAM: DraftTeam = "blue";

const LANES: Lane[] = ["Jungle", "Exp", "Mid", "Gold", "Roam"];
const LANE_ICON: Record<Lane, string> = {
  Jungle: "🌿", Exp: "⚔️", Mid: "🔮", Gold: "🏹", Roam: "🛡️",
};

interface DraftSimTabProps {
  heroes: Hero[];
}

export function DraftSimTab({ heroes }: DraftSimTabProps) {
  const simSlots = useDraftStore((s) => s.simSlots);
  const simDraftMode = useDraftStore((s) => s.simDraftMode);
  const simSelectedStep = useDraftStore((s) => s.simSelectedStep);
  const simFirstPickTeam = useDraftStore((s) => s.simFirstPickTeam);
  const simSelectSlot = useDraftStore((s) => s.simSelectSlot);
  const simAssignHero = useDraftStore((s) => s.simAssignHero);
  const simClearSlot = useDraftStore((s) => s.simClearSlot);
  const simSetDraftMode = useDraftStore((s) => s.simSetDraftMode);
  const simSetFirstPickTeam = useDraftStore((s) => s.simSetFirstPickTeam);
  const simReset = useDraftStore((s) => s.simReset);

  const [query, setQuery] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isComplete = isPickPhaseComplete(simSlots);
  const selectedSlot =
    simSelectedStep !== null ? simSlots[simSelectedStep] ?? null : null;

  const blueBans = useMemo(() => getTeamBans(simSlots, "blue"), [simSlots]);
  const redBans = useMemo(() => getTeamBans(simSlots, "red"), [simSlots]);
  const bluePicks = useMemo(() => getTeamPicks(simSlots, "blue"), [simSlots]);
  const redPicks = useMemo(() => getTeamPicks(simSlots, "red"), [simSlots]);

  const enemyPicks = redPicks;
  const unavailableForPick = useMemo(
    () => getUnavailableForPick(simSlots),
    [simSlots]
  );

  const filtered = useMemo(() => filterHeroes(heroes, query), [heroes, query]);

  const resetTimer = useCallback(() => setTimeLeft(TIMER_SECONDS), []);

  useEffect(() => {
    if (!timerActive || isComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, isComplete]);

  const handleSelectHero = useCallback(
    (hero: Hero) => {
      if (isComplete || simSelectedStep === null || !selectedSlot) return;
      if (isHeroDisabledForSlot(hero.id, selectedSlot, simSlots)) return;
      simAssignHero(hero.id);
      setQuery("");
      resetTimer();
    },
    [isComplete, simSelectedStep, selectedSlot, simSlots, simAssignHero, resetTimer]
  );

  const isBanMode = simDraftMode === "ban";

  return (
    <div className="max-w-6xl mx-auto px-2 py-3 space-y-3">
      {/* Top bar */}
      <div className="bg-surface border border-border rounded-xl px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-primary">🔵 Blue (you)</span>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <span className="text-xs text-text-muted">First pick:</span>
          <button
            type="button"
            onClick={() => simSetFirstPickTeam("blue")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
              simFirstPickTeam === "blue"
                ? "bg-primary text-white"
                : "text-primary border border-primary/30 hover:bg-primary/10"
            )}
          >
            Kita
          </button>
          <button
            type="button"
            onClick={() => simSetFirstPickTeam("red")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
              simFirstPickTeam === "red"
                ? "bg-danger text-white"
                : "text-danger border border-danger/30 hover:bg-danger/10"
            )}
          >
            Musuh
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {isComplete ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-success bg-success/10 border border-success/30">
                ✓ Done
              </span>
            ) : (
              <span className="text-xs text-text-muted">
                {isBanMode ? "Klik hero untuk ban" : "Klik hero untuk pick"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-between">
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => simSetDraftMode("ban")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                isBanMode ? "bg-danger/90 text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              Ban
            </button>
            <button
              type="button"
              onClick={() => simSetDraftMode("pick")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                !isBanMode ? "bg-success text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              Pick
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isBanMode && (
              <button
                type="button"
                onClick={() => simSetDraftMode("pick")}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-success border border-success/30 bg-success/5 hover:bg-success/15 transition-colors"
              >
                <SkipForward size={11} />
                <span className="hidden sm:inline">Lewati ke Pick</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setTimerActive((v) => !v)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                timerActive
                  ? "text-warning bg-warning/10 border border-warning/30"
                  : "text-text-muted border border-border hover:text-text-primary"
              )}
            >
              <Clock size={11} />
              {timerActive ? (
                <span
                  className={cn(
                    "font-mono font-bold w-4",
                    timeLeft <= 5 && "text-danger animate-pulse"
                  )}
                >
                  {timeLeft}
                </span>
              ) : (
                <span>Timer</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                simReset();
                setTimerActive(false);
                resetTimer();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-danger border border-danger/30 bg-danger/5 hover:bg-danger/15 transition-colors"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[180px_1fr_180px] lg:grid-cols-[200px_1fr_200px] gap-3">
        <TeamPanel
          team="blue"
          bans={blueBans}
          picks={bluePicks}
          heroes={heroes}
          draftMode={simDraftMode}
          selectedStep={simSelectedStep}
          firstPickTeam={simFirstPickTeam}
          onSelectSlot={simSelectSlot}
          onClearSlot={simClearSlot}
        />
        <CenterPanel
          heroes={heroes}
          filtered={filtered}
          query={query}
          setQuery={setQuery}
          isComplete={isComplete}
          isBanMode={isBanMode}
          selectedSlot={selectedSlot}
          simSlots={simSlots}
          bluePicks={bluePicks}
          redPicks={redPicks}
          onSelectHero={handleSelectHero}
        />
        <TeamPanel
          team="red"
          bans={redBans}
          picks={redPicks}
          heroes={heroes}
          draftMode={simDraftMode}
          selectedStep={simSelectedStep}
          firstPickTeam={simFirstPickTeam}
          onSelectSlot={simSelectSlot}
          onClearSlot={simClearSlot}
        />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden space-y-3">
        <CenterPanel
          heroes={heroes}
          filtered={filtered}
          query={query}
          setQuery={setQuery}
          isComplete={isComplete}
          isBanMode={isBanMode}
          selectedSlot={selectedSlot}
          simSlots={simSlots}
          bluePicks={bluePicks}
          redPicks={redPicks}
          onSelectHero={handleSelectHero}
        />
        <div className="grid grid-cols-2 gap-2">
          <TeamPanel
            team="blue"
            bans={blueBans}
            picks={bluePicks}
            heroes={heroes}
            draftMode={simDraftMode}
            selectedStep={simSelectedStep}
            firstPickTeam={simFirstPickTeam}
            onSelectSlot={simSelectSlot}
            onClearSlot={simClearSlot}
            compact
          />
          <TeamPanel
            team="red"
            bans={redBans}
            picks={redPicks}
            heroes={heroes}
            draftMode={simDraftMode}
            selectedStep={simSelectedStep}
            firstPickTeam={simFirstPickTeam}
            onSelectSlot={simSelectSlot}
            onClearSlot={simClearSlot}
            compact
          />
        </div>
      </div>

      {enemyPicks.some((s) => s.heroId) && (
        <CounterGuide
          enemyPicks={enemyPicks}
          heroes={heroes}
          unavailableIds={unavailableForPick}
        />
      )}
    </div>
  );
}

function CenterPanel({
  heroes,
  filtered,
  query,
  setQuery,
  isComplete,
  isBanMode,
  selectedSlot,
  simSlots,
  bluePicks,
  redPicks,
  onSelectHero,
}: {
  heroes: Hero[];
  filtered: Hero[];
  query: string;
  setQuery: (q: string) => void;
  isComplete: boolean;
  isBanMode: boolean;
  selectedSlot: DraftSlot | null;
  simSlots: DraftSlot[];
  bluePicks: DraftSlot[];
  redPicks: DraftSlot[];
  onSelectHero: (hero: Hero) => void;
}) {
  if (isComplete) {
    return <DraftSummary heroes={heroes} bluePicks={bluePicks} redPicks={redPicks} />;
  }

  return (
    <div className="space-y-2">
      {selectedSlot ? (
        <p className="text-xs text-center text-text-muted">
          {isBanMode ? "Ban" : "Pick"}{" "}
          <span className="font-semibold text-text-primary">
            {selectedSlot.action.team === "blue" ? "🔵 Blue" : "🔴 Red"}
          </span>{" "}
          — pilih hero
        </p>
      ) : (
        <p className="text-xs text-center text-text-muted italic">
          {isBanMode
            ? "Semua slot ban terisi — lanjut ke Pick"
            : "Semua pick terisi"}
        </p>
      )}
      <HeroSearch value={query} onChange={setQuery} autoFocus placeholder="Search hero…" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(62px,1fr))] gap-1.5 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((hero) => {
          const disabled =
            !selectedSlot ||
            isHeroDisabledForSlot(hero.id, selectedSlot, simSlots);
          return (
            <MiniHeroCard
              key={hero.id}
              hero={hero}
              isBan={isBanMode}
              disabled={disabled}
              onClick={() => onSelectHero(hero)}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="text-text-muted text-xs py-4 w-full text-center col-span-full">
            No heroes match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

function TeamPanel({
  team,
  bans,
  picks,
  heroes,
  draftMode,
  selectedStep,
  firstPickTeam,
  onSelectSlot,
  onClearSlot,
  compact = false,
}: {
  team: DraftTeam;
  bans: DraftSlot[];
  picks: DraftSlot[];
  heroes: Hero[];
  draftMode: DraftMode;
  selectedStep: number | null;
  firstPickTeam: DraftTeam;
  onSelectSlot: (step: number) => void;
  onClearSlot: (step: number) => void;
  compact?: boolean;
}) {
  const accent = team === "blue" ? "#4F8EF7" : "#F87171";
  const isMe = team === MY_TEAM;

  return (
    <div
      className={cn("rounded-xl border p-2 space-y-2", compact ? "" : "p-2.5")}
      style={{ borderColor: "#252A35" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-sm" style={{ color: accent }}>
          {team === "blue" ? "🔵" : "🔴"}
          {!compact && (team === "blue" ? " Blue" : " Red")}
          {isMe && (
            <span className="ml-1 text-[9px] text-text-muted font-sans">(you)</span>
          )}
        </span>
        {draftMode === "pick" && firstPickTeam === team && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
            1st pick
          </span>
        )}
      </div>

      <div>
        <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
          <ShieldOff size={9} /> Bans ({bans.filter((b) => b.heroId).length}/5)
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const slot = bans[i];
            if (!slot) return null;
            const hero = slot.heroId
              ? (getHeroById(heroes, slot.heroId) ?? null)
              : null;
            const isSelected = selectedStep === slot.step;
            const canSelect = draftMode === "ban" && !slot.heroId;
            return (
              <BanSlot
                key={slot.step}
                hero={hero}
                isSelected={isSelected}
                canSelect={canSelect}
                accent={accent}
                onSelect={canSelect ? () => onSelectSlot(slot.step) : undefined}
                onClear={slot.heroId ? () => onClearSlot(slot.step) : undefined}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
          <Sword size={9} /> Picks ({picks.filter((p) => p.heroId).length}/5)
        </p>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const slot = picks[i];
            if (!slot) return null;
            const hero = slot.heroId
              ? (getHeroById(heroes, slot.heroId) ?? null)
              : null;
            const isSelected = selectedStep === slot.step;
            const canSelect = draftMode === "pick" && !slot.heroId;
            const isFirstPickSlot = i === 0 && firstPickTeam === team;
            return (
              <PickSlot
                key={slot.step}
                hero={hero}
                index={i + 1}
                isSelected={isSelected}
                canSelect={canSelect}
                isFirstPick={isFirstPickSlot}
                accent={accent}
                compact={compact}
                onSelect={canSelect ? () => onSelectSlot(slot.step) : undefined}
                onClear={slot.heroId ? () => onClearSlot(slot.step) : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BanSlot({
  hero,
  isSelected,
  canSelect,
  accent,
  onSelect,
  onClear,
}: {
  hero: Hero | null;
  isSelected: boolean;
  canSelect: boolean;
  accent: string;
  onSelect?: () => void;
  onClear?: () => void;
}) {
  if (hero && onClear) {
    return (
      <button
        type="button"
        onClick={onClear}
        title={`Hapus ban: ${hero.name}`}
        className="relative flex-1 aspect-square rounded border overflow-hidden cursor-pointer group/ban hover:border-danger/70 transition-colors"
        style={{ borderColor: "#252A35" }}
      >
        <Image
          src={hero.image}
          alt={hero.name}
          fill
          sizes="64px"
          className="object-cover grayscale opacity-50"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-danger/40 group-hover/ban:bg-danger/60">
          <span className="text-danger text-base font-bold">✕</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5">
          <p className="text-[7px] text-center text-white truncate">{hero.name}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!canSelect}
      className={cn(
        "relative flex-1 aspect-square rounded border overflow-hidden transition-all",
        canSelect ? "cursor-pointer hover:border-danger/50" : "cursor-default opacity-60"
      )}
      style={
        isSelected
          ? { borderColor: accent, boxShadow: `0 0 8px ${accent}60` }
          : { borderColor: "#252A35" }
      }
    >
      {isSelected ? (
        <div
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: `${accent}20` }}
        >
          <span style={{ color: accent }} className="text-base font-bold">?</span>
        </div>
      ) : (
        <div className="absolute inset-0 border border-dashed border-border/30 rounded" />
      )}
    </button>
  );
}

function PickSlot({
  hero,
  index,
  isSelected,
  canSelect,
  isFirstPick,
  accent,
  compact,
  onSelect,
  onClear,
}: {
  hero: Hero | null;
  index: number;
  isSelected: boolean;
  canSelect: boolean;
  isFirstPick: boolean;
  accent: string;
  compact?: boolean;
  onSelect?: () => void;
  onClear?: () => void;
}) {
  if (hero && onClear) {
    return (
      <button
        type="button"
        onClick={onClear}
        title={`Hapus pick: ${hero.name}`}
        className={cn(
          "flex items-center gap-1 rounded-lg border p-1 transition-all w-full text-left cursor-pointer hover:border-danger/50 hover:bg-danger/5",
          compact ? "min-h-[30px]" : "min-h-[38px]",
          "bg-surface/80"
        )}
        style={{ borderColor: `${accent}30` }}
      >
        <div
          className={cn(
            "relative flex-shrink-0 rounded overflow-hidden",
            compact ? "w-5 h-5" : "w-7 h-7"
          )}
        >
          <Image
            src={hero.image}
            alt={hero.name}
            fill
            sizes="64px"
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-display font-semibold truncate leading-tight",
              compact ? "text-[9px]" : "text-[11px]"
            )}
          >
            {hero.name}
          </p>
        </div>
        <span className="text-danger text-[10px] font-bold flex-shrink-0 opacity-60">✕</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!canSelect}
      className={cn(
        "flex items-center gap-1 rounded-lg border p-1 transition-all w-full text-left",
        compact ? "min-h-[30px]" : "min-h-[38px]",
        "bg-background/30",
        canSelect ? "cursor-pointer hover:border-primary/40" : "cursor-default opacity-60"
      )}
      style={
        isSelected
          ? { borderColor: accent, boxShadow: `0 0 8px ${accent}40` }
          : { borderColor: "#252A35" }
      }
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold flex-shrink-0",
          compact ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]"
        )}
        style={
          isSelected
            ? { backgroundColor: `${accent}30`, color: accent }
            : { backgroundColor: "#252A35", color: "#64748B" }
        }
      >
        {index}
      </div>
      {!compact && (
        <span className="text-[10px] text-text-muted italic">
          {isFirstPick ? "1st pick" : isSelected ? "Pilih hero…" : "—"}
        </span>
      )}
    </button>
  );
}

function MiniHeroCard({
  hero,
  isBan,
  disabled,
  onClick,
}: {
  hero: Hero;
  isBan: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Pilih slot dulu" : hero.name}
      className={cn(
        "group relative flex flex-col items-center gap-0.5 rounded-lg border p-1.5 w-full transition-all",
        disabled
          ? "border-border/50 bg-background/40 opacity-40 cursor-not-allowed"
          : cn(
              "border-border bg-surface",
              isBan
                ? "hover:border-danger/70 hover:bg-danger/10"
                : "hover:border-primary/70 hover:bg-primary/10"
            )
      )}
    >
      <div className="relative w-9 h-9 rounded overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.name}
          fill
          sizes="64px"
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/heroes/placeholder.webp";
          }}
        />
        <div className="absolute top-0 right-0">
          <TierBadge tier={hero.tier} className="w-3.5 h-3.5 text-[7px]" />
        </div>
      </div>
      <span className="text-[8px] font-display font-semibold text-center leading-tight truncate w-full">
        {hero.name}
      </span>
    </button>
  );
}

function CounterGuide({
  enemyPicks,
  heroes,
  unavailableIds,
}: {
  enemyPicks: DraftSlot[];
  heroes: Hero[];
  unavailableIds: Set<string>;
}) {
  const [activeLane, setActiveLane] = useState<Lane>("Jungle");

  const pickedEnemies = useMemo(
    () =>
      enemyPicks
        .filter((s) => s.heroId)
        .map((s) => getHeroById(heroes, s.heroId!))
        .filter(Boolean) as Hero[],
    [enemyPicks, heroes]
  );

  const laneRankings = useMemo(() => {
    const result: Partial<
      Record<Lane, { hero: Hero; countersWhich: Hero[]; score: number }[]>
    > = {};
    for (const lane of LANES) {
      const candidates = heroes.filter(
        (h) => !unavailableIds.has(h.id) && h.lane.includes(lane)
      );
      const ranked = candidates
        .map((hero) => {
          const countersWhich = pickedEnemies.filter((ep) =>
            hero.strongAgainst.includes(ep.id)
          );
          const score = countersWhich.length * 15 + hero.winRate;
          return { hero, countersWhich, score };
        })
        .sort((a, b) => b.score - a.score);
      result[lane] = ranked;
    }
    return result;
  }, [heroes, unavailableIds, pickedEnemies]);

  const activeList = laneRankings[activeLane] ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Sword size={12} className="text-warning flex-shrink-0" />
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-warning">
          Counter Guide
        </h3>
        <span className="text-[10px] text-text-muted">
          vs {pickedEnemies.length} enemy pick{pickedEnemies.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex border-b border-border overflow-x-auto">
        {LANES.map((lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => setActiveLane(lane)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 px-2 py-2 border-b-2 flex-shrink-0",
              activeLane === lane
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-text-muted hover:text-text-primary"
            )}
          >
            <span className="text-sm">{LANE_ICON[lane]}</span>
            <span className="text-[10px] font-semibold">{lane}</span>
          </button>
        ))}
      </div>

      <div className="p-3 space-y-1.5">
        {activeList.length === 0 ? (
          <p className="text-xs text-text-muted italic">No heroes available for {activeLane}.</p>
        ) : (
          activeList.slice(0, 8).map(({ hero, countersWhich }, idx) => (
            <LaneHeroRow
              key={hero.id}
              hero={hero}
              rank={idx + 1}
              countersWhich={countersWhich}
              totalEnemies={pickedEnemies.length}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LaneHeroRow({
  hero,
  rank,
  countersWhich,
  totalEnemies,
}: {
  hero: Hero;
  rank: number;
  countersWhich: Hero[];
  totalEnemies: number;
}) {
  const wrColor =
    hero.winRate >= 52 ? "#34D399" : hero.winRate >= 50 ? "#4F8EF7" : "#FBBF24";
  const isTopPick = rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2",
        isTopPick ? "border-success/40 bg-success/5" : "border-border bg-background/30"
      )}
    >
      <span
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
          isTopPick ? "bg-success text-background" : "bg-border text-text-muted"
        )}
      >
        {rank}
      </span>
      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
        <Image src={hero.image} alt={hero.name} fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-display font-semibold text-sm">{hero.name}</span>
        <span className="text-[10px] ml-2 font-mono" style={{ color: wrColor }}>
          {hero.winRate.toFixed(1)}%
        </span>
        {countersWhich.length > 0 && (
          <p className="text-[9px] text-success truncate">
            counters {countersWhich.map((e) => e.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function DraftSummary({
  heroes,
  bluePicks,
  redPicks,
}: {
  heroes: Hero[];
  bluePicks: DraftSlot[];
  redPicks: DraftSlot[];
}) {
  const blueHeroes = bluePicks
    .map((s) => (s.heroId ? getHeroById(heroes, s.heroId) : null))
    .filter(Boolean) as Hero[];
  const redHeroes = redPicks
    .map((s) => (s.heroId ? getHeroById(heroes, s.heroId) : null))
    .filter(Boolean) as Hero[];

  const blueAvgWr = blueHeroes.length
    ? blueHeroes.reduce((a, h) => a + h.winRate, 0) / blueHeroes.length
    : 50;
  const redAvgWr = redHeroes.length
    ? redHeroes.reduce((a, h) => a + h.winRate, 0) / redHeroes.length
    : 50;
  const cb = blueHeroes.reduce(
    (a, h) => a + redHeroes.filter((r) => h.strongAgainst.includes(r.id)).length * 1.5,
    0
  );
  const cr = redHeroes.reduce(
    (a, h) => a + blueHeroes.filter((b) => h.strongAgainst.includes(b.id)).length * 1.5,
    0
  );
  const blueEst = Math.min(80, Math.max(20, blueAvgWr - redAvgWr + 50 + cb - cr));

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold font-display text-center">Draft Complete</p>
      <div className="grid grid-cols-2 gap-2">
        <SummaryTeam label="Blue" accent="#4F8EF7" heroes={blueHeroes} winEst={blueEst} />
        <SummaryTeam label="Red" accent="#F87171" heroes={redHeroes} winEst={100 - blueEst} />
      </div>
    </div>
  );
}

function SummaryTeam({
  label,
  accent,
  heroes,
  winEst,
}: {
  label: string;
  accent: string;
  heroes: Hero[];
  winEst: number;
}) {
  return (
    <div className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${accent}40` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold font-display" style={{ color: accent }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color: accent }}>
          {winEst.toFixed(1)}%
        </span>
      </div>
      {heroes.map((h) => (
        <div key={h.id} className="flex items-center gap-1.5">
          <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
            <Image src={h.image} alt={h.name} fill sizes="64px" className="object-cover" />
          </div>
          <span className="text-[10px] font-display font-semibold truncate flex-1">{h.name}</span>
          <TierBadge tier={h.tier} className="w-4 h-4 text-[8px]" />
        </div>
      ))}
    </div>
  );
}
