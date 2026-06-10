"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  RotateCcw, Undo2, Clock, Sword, ShieldOff, Users,
} from "lucide-react";
import { useDraftStore } from "@/store/useDraftStore";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { TierBadge } from "@/components/ui/TierBadge";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { filterHeroes, getHeroById } from "@/lib/heroes";
import {
  DRAFT_ORDER, TOTAL_STEPS,
  getTeamBans, getTeamPicks,
  getUsedHeroIds, getPhaseName,
  type DraftSlot,
} from "@/lib/draft";
import { cn } from "@/lib/utils";
import type { Hero, Lane } from "@/lib/types";

const TIMER_SECONDS = 30;

const LANES: Lane[] = ["Jungle", "Exp", "Mid", "Gold", "Roam"];
const LANE_ICON: Record<Lane, string> = {
  Jungle: "🌿", Exp: "⚔️", Mid: "🔮", Gold: "🏹", Roam: "🛡️",
};

interface DraftSimTabProps { heroes: Hero[] }

export function DraftSimTab({ heroes }: DraftSimTabProps) {
  const simSlots   = useDraftStore((s) => s.simSlots);
  const simStep    = useDraftStore((s) => s.simStep);
  const simPickHero = useDraftStore((s) => s.simPickHero);
  const simUndo    = useDraftStore((s) => s.simUndo);
  const simReset   = useDraftStore((s) => s.simReset);

  const [query, setQuery]           = useState("");
  const [myTeam, setMyTeam]         = useState<"blue" | "red">("blue");
  const [timeLeft, setTimeLeft]     = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enemyTeam = myTeam === "blue" ? "red" : "blue";
  const isComplete = simStep >= TOTAL_STEPS;
  const currentAction = !isComplete ? DRAFT_ORDER[simStep] : null;
  const usedIds = useMemo(() => getUsedHeroIds(simSlots), [simSlots]);

  const blueBans  = useMemo(() => getTeamBans(simSlots, "blue"),  [simSlots]);
  const redBans   = useMemo(() => getTeamBans(simSlots, "red"),   [simSlots]);
  const bluePicks = useMemo(() => getTeamPicks(simSlots, "blue"), [simSlots]);
  const redPicks  = useMemo(() => getTeamPicks(simSlots, "red"),  [simSlots]);

  const enemyPicks = enemyTeam === "red" ? redPicks : bluePicks;

  const filtered = useMemo(
    () => filterHeroes(heroes, query).filter((h) => !usedIds.has(h.id)),
    [heroes, query, usedIds]
  );

  // Timer
  const resetTimer = useCallback(() => setTimeLeft(TIMER_SECONDS), []);
  useEffect(() => { resetTimer(); }, [simStep, resetTimer]);
  useEffect(() => {
    if (!timerActive || isComplete) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, simStep, isComplete]);

  const handleSelect = useCallback((hero: Hero) => {
    if (isComplete || usedIds.has(hero.id)) return;
    simPickHero(hero.id);
    setQuery("");
    resetTimer();
  }, [isComplete, usedIds, simPickHero, resetTimer]);

  const teamColor = currentAction?.team === "blue" ? "#4F8EF7" : "#F87171";
  const actionLabel = currentAction?.type === "ban" ? "BAN" : "PICK";

  return (
    <div className="max-w-6xl mx-auto px-2 py-3 space-y-3">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2">

        {/* Row 1: team toggle + phase badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users size={13} className="text-text-muted flex-shrink-0" />
          <span className="text-xs text-text-muted flex-shrink-0">I am:</span>
          <button onClick={() => setMyTeam("blue")}
            className={cn("px-2.5 py-1 rounded text-xs font-bold transition-colors flex-shrink-0",
              myTeam === "blue" ? "bg-primary text-white" : "text-primary border border-primary/30 hover:bg-primary/10")}>
            🔵 Blue
          </button>
          <button onClick={() => setMyTeam("red")}
            className={cn("px-2.5 py-1 rounded text-xs font-bold transition-colors flex-shrink-0",
              myTeam === "red" ? "bg-danger text-white" : "text-danger border border-danger/30 hover:bg-danger/10")}>
            🔴 Red
          </button>

          {/* Phase badge — center */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <span className="text-xs text-text-muted hidden sm:block truncate">{getPhaseName(simStep)}</span>
            {!isComplete && currentAction && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase flex-shrink-0"
                style={{ backgroundColor: `${teamColor}20`, color: teamColor, border: `1px solid ${teamColor}40` }}>
                {currentAction.team === "blue" ? "🔵" : "🔴"} {actionLabel}
              </span>
            )}
            {isComplete && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-success bg-success/10 border border-success/30 flex-shrink-0">
                ✓ Done
              </span>
            )}
          </div>
        </div>

        {/* Row 2 (or right side on sm+): controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setTimerActive((v) => !v)}
            className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
              timerActive ? "text-warning bg-warning/10 border border-warning/30" : "text-text-muted border border-border hover:text-text-primary")}>
            <Clock size={11} />
            {timerActive
              ? <span className={cn("font-mono font-bold w-4", timeLeft <= 5 && "text-danger animate-pulse")}>{timeLeft}</span>
              : <span>Timer</span>}
          </button>
          <button onClick={simUndo} disabled={simStep === 0}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted border border-border hover:text-text-primary hover:bg-surface disabled:opacity-30 transition-colors">
            <Undo2 size={11} /><span className="hidden xs:inline">Undo</span>
          </button>
          <button onClick={() => { simReset(); setTimerActive(false); resetTimer(); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-danger border border-danger/30 bg-danger/5 hover:bg-danger/15 transition-colors">
            <RotateCcw size={11} /><span className="hidden xs:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* ── Phase tracker ──────────────────────────────────────── */}
      <PhaseTracker simStep={simStep} />

      {/* ── Desktop: 3-column grid ──────────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-[180px_1fr_180px] lg:grid-cols-[200px_1fr_200px] gap-3">
        <DesktopTeamPanel team="blue" bans={blueBans} picks={bluePicks} heroes={heroes}
          currentStep={simStep} myTeam={myTeam} />

        {/* Center */}
        <div className="space-y-2">
          {!isComplete ? (
            <>
              <HeroSearch value={query} onChange={setQuery} autoFocus placeholder="Search hero…" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(62px,1fr))] gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                {filtered.map((hero) => (
                  <MiniHeroCard key={hero.id} hero={hero}
                    isBan={currentAction?.type === "ban"}
                    onClick={() => handleSelect(hero)} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-text-muted text-xs py-4 w-full text-center">No heroes match &ldquo;{query}&rdquo;</p>
                )}
              </div>
            </>
          ) : (
            <DraftSummary heroes={heroes} bluePicks={bluePicks} redPicks={redPicks} />
          )}
        </div>

        <DesktopTeamPanel team="red" bans={redBans} picks={redPicks} heroes={heroes}
          currentStep={simStep} myTeam={myTeam} />
      </div>

      {/* ── Mobile: hero grid first, then team panels side by side ─ */}
      <div className="md:hidden space-y-3">
        {/* Hero grid / summary */}
        <div className="space-y-2">
          {!isComplete ? (
            <>
              <HeroSearch value={query} onChange={setQuery} autoFocus placeholder="Search hero…" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(62px,1fr))] gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {filtered.map((hero) => (
                  <MiniHeroCard key={hero.id} hero={hero}
                    isBan={currentAction?.type === "ban"}
                    onClick={() => handleSelect(hero)} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-text-muted text-xs py-4 w-full text-center">No heroes match &ldquo;{query}&rdquo;</p>
                )}
              </div>
            </>
          ) : (
            <DraftSummary heroes={heroes} bluePicks={bluePicks} redPicks={redPicks} />
          )}
        </div>

        {/* Blue + Red side by side */}
        <div className="grid grid-cols-2 gap-2">
          <MobileTeamPanel team="blue" bans={blueBans} picks={bluePicks} heroes={heroes}
            currentStep={simStep} myTeam={myTeam} />
          <MobileTeamPanel team="red" bans={redBans} picks={redPicks} heroes={heroes}
            currentStep={simStep} myTeam={myTeam} />
        </div>
      </div>

      {/* ── Counter Guide ────────────────────────────────────────── */}
      {enemyPicks.some((s) => s.heroId) && (
        <CounterGuide enemyPicks={enemyPicks} heroes={heroes} usedIds={usedIds} />
      )}

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <PickOrderTimeline simStep={simStep} simSlots={simSlots} heroes={heroes} />
    </div>
  );
}

// ─── Phase Tracker ──────────────────────────────────────────────
function PhaseTracker({ simStep }: { simStep: number }) {
  const phases = [
    { label: "🔵 Ban 1",  steps: [0, 2],  desc: "Blue bans 3",   color: "#4F8EF7" },
    { label: "🔴 Ban 1",  steps: [3, 5],  desc: "Red bans 3",    color: "#F87171" },
    { label: "🔵 Ban 2",  steps: [6, 7],  desc: "Blue bans 2",   color: "#4F8EF7" },
    { label: "🔴 Ban 2",  steps: [8, 9],  desc: "Red bans 2",    color: "#F87171" },
    { label: "⚔️ Picks",  steps: [10, 19], desc: "5 each · snake", color: "#34D399" },
  ];
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {phases.map((ph) => {
        const isActive = simStep >= ph.steps[0] && simStep <= ph.steps[1];
        const isDone   = simStep > ph.steps[1];
        return (
          <div key={ph.label} className={cn(
            "rounded-lg border px-2 py-1.5 text-center transition-all",
            isActive ? "" : isDone ? "opacity-50" : "opacity-25 border-border"
          )}
          style={isActive ? { borderColor: ph.color, backgroundColor: `${ph.color}12` } : {}}>
            <p className="text-[10px] font-bold leading-tight" style={{ color: isActive ? ph.color : "#64748B" }}>
              {ph.label}
            </p>
            <p className="text-[9px] text-text-muted leading-tight">{ph.desc}</p>
            {isDone && <p className="text-[8px] text-success mt-0.5">✓</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Panel ─────────────────────────────────────────────────
interface TeamPanelProps {
  team: "blue" | "red";
  bans: DraftSlot[];
  picks: DraftSlot[];
  heroes: Hero[];
  currentStep: number;
  myTeam: "blue" | "red";
  compact?: boolean;
}

// Shared inner content used by both desktop panel and mobile compact panel
function TeamPanelContent({
  team, bans, picks, heroes, currentStep, isMe, isMyTurn, currentAction, accent, compact,
}: {
  team: "blue" | "red"; bans: DraftSlot[]; picks: DraftSlot[]; heroes: Hero[];
  currentStep: number; isMe: boolean; isMyTurn: boolean;
  currentAction: { type: "ban" | "pick"; team: "blue" | "red" } | null;
  accent: string; compact: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-sm" style={{ color: accent }}>
          {team === "blue" ? "🔵" : "🔴"}{!compact && (team === "blue" ? " Blue" : " Red")}
          {isMe && <span className="ml-1 text-[9px] text-text-muted font-sans">(you)</span>}
        </span>
        {isMyTurn && currentAction && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse uppercase"
            style={{ backgroundColor: `${accent}20`, color: accent }}>
            {currentAction.type}
          </span>
        )}
      </div>

      {/* Bans row */}
      <div>
        <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
          <ShieldOff size={9} /> Bans ({bans.filter((b) => b.heroId).length}/5)
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const slot = bans[i];
            const hero = slot?.heroId ? getHeroById(heroes, slot.heroId) : null;
            const isActive = currentStep < TOTAL_STEPS && slot?.step === currentStep;
            return <BanSlot key={i} hero={hero ?? null} isActive={isActive} accent={accent} />;
          })}
        </div>
      </div>

      {/* Picks */}
      <div>
        <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
          <Sword size={9} /> Picks ({picks.filter((p) => p.heroId).length}/5)
        </p>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const slot = picks[i];
            const hero = slot?.heroId ? getHeroById(heroes, slot.heroId) : null;
            const isActive = currentStep < TOTAL_STEPS && slot?.step === currentStep;
            return <PickSlot key={i} hero={hero ?? null} index={i + 1} isActive={isActive} accent={accent} compact={compact} />;
          })}
        </div>
      </div>
    </>
  );
}

// Mobile compact wrapper — always visible on mobile, hidden on md+
function MobileTeamPanel({ team, bans, picks, heroes, currentStep, myTeam }: Omit<TeamPanelProps, "compact">) {
  const accent = team === "blue" ? "#4F8EF7" : "#F87171";
  const isMe   = team === myTeam;
  const currentAction = currentStep < TOTAL_STEPS ? DRAFT_ORDER[currentStep] : null;
  const isMyTurn = currentAction?.team === team;
  return (
    <div className="rounded-xl border p-2 space-y-2 transition-all"
      style={isMyTurn ? { borderColor: accent, boxShadow: `0 0 10px ${accent}25` } : { borderColor: "#252A35" }}>
      <TeamPanelContent
        team={team} bans={bans} picks={picks} heroes={heroes}
        currentStep={currentStep} isMe={isMe} isMyTurn={isMyTurn}
        currentAction={currentAction} accent={accent} compact
      />
    </div>
  );
}

// Desktop panel — always hidden below md, visible md+
function DesktopTeamPanel({ team, bans, picks, heroes, currentStep, myTeam }: Omit<TeamPanelProps, "compact">) {
  const accent = team === "blue" ? "#4F8EF7" : "#F87171";
  const isMe   = team === myTeam;
  const currentAction = currentStep < TOTAL_STEPS ? DRAFT_ORDER[currentStep] : null;
  const isMyTurn = currentAction?.team === team;
  return (
    <div className="rounded-xl border p-2.5 space-y-2 transition-all"
      style={isMyTurn ? { borderColor: accent, boxShadow: `0 0 14px ${accent}25` } : { borderColor: "#252A35" }}>
      <TeamPanelContent
        team={team} bans={bans} picks={picks} heroes={heroes}
        currentStep={currentStep} isMe={isMe} isMyTurn={isMyTurn}
        currentAction={currentAction} accent={accent} compact={false}
      />
    </div>
  );
}

function BanSlot({ hero, isActive, accent }: { hero: Hero | null; isActive: boolean; accent: string }) {
  return (
    <div className={cn("relative flex-1 aspect-square rounded border overflow-hidden")}
      style={isActive ? { borderColor: accent, boxShadow: `0 0 8px ${accent}60` } : { borderColor: "#252A35" }}>
      {hero ? (
        <>
          <Image src={hero.image} alt={hero.name} fill sizes="64px" className="object-cover grayscale opacity-50"
            onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
          <div className="absolute inset-0 bg-danger/40 flex items-center justify-center">
            <span className="text-danger text-base font-bold leading-none">✕</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5">
            <p className="text-[7px] text-center text-white truncate">{hero.name}</p>
          </div>
        </>
      ) : isActive ? (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: `${accent}20` }}>
          <span style={{ color: accent }} className="text-base font-bold">?</span>
        </div>
      ) : (
        <div className="absolute inset-0 border border-dashed border-border/30 rounded" />
      )}
    </div>
  );
}

function PickSlot({ hero, index, isActive, accent, compact = false }: {
  hero: Hero | null; index: number; isActive: boolean; accent: string; compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border p-1 transition-all",
      compact ? "min-h-[30px]" : "min-h-[38px]",
      hero ? "bg-surface/80" : "bg-background/30")}
      style={isActive ? { borderColor: accent, boxShadow: `0 0 8px ${accent}40` } : { borderColor: hero ? `${accent}30` : "#252A35" }}>
      {hero ? (
        <>
          <div className={cn("relative flex-shrink-0 rounded overflow-hidden", compact ? "w-5 h-5" : "w-7 h-7")}>
            <Image src={hero.image} alt={hero.name} fill sizes="64px" className="object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-display font-semibold truncate leading-tight", compact ? "text-[9px]" : "text-[11px]")}>
              {hero.name}
            </p>
            {!compact && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {hero.role.slice(0, 1).map((r) => <RoleBadge key={r} role={r} className="text-[8px] px-1 py-0" />)}
                <TierBadge tier={hero.tier} className="w-4 h-4 text-[8px]" />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1 px-0.5">
          <div className={cn("rounded-full flex items-center justify-center font-bold flex-shrink-0",
            compact ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]")}
            style={isActive ? { backgroundColor: `${accent}30`, color: accent } : { backgroundColor: "#252A35", color: "#64748B" }}>
            {index}
          </div>
          {!compact && <span className="text-[10px] text-text-muted italic">{isActive ? "Picking…" : "—"}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Mini Hero Card ──────────────────────────────────────────────
function MiniHeroCard({ hero, isBan, onClick }: { hero: Hero; isBan: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("group relative flex flex-col items-center gap-0.5 rounded-lg border p-1.5 w-full transition-all",
        "border-border bg-surface",
        isBan
          ? "hover:border-danger/70 hover:bg-danger/10 hover:shadow-[0_0_8px_rgba(248,113,113,0.3)]"
          : "hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(79,142,247,0.3)]")}>
      <div className="relative w-9 h-9 rounded overflow-hidden">
        <Image src={hero.image} alt={hero.name} fill sizes="64px" className="object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
        <div className="absolute top-0 right-0">
          <TierBadge tier={hero.tier} className="w-3.5 h-3.5 text-[7px]" />
        </div>
      </div>
      <span className="text-[8px] font-display font-semibold text-center leading-tight truncate w-full">
        {hero.name}
      </span>
      {isBan && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-danger/20">
          <span className="text-danger text-[10px] font-bold">BAN</span>
        </div>
      )}
    </button>
  );
}

// ─── Counter Guide (per lane) ────────────────────────────────────
interface CounterGuideProps {
  enemyPicks: DraftSlot[];
  heroes: Hero[];
  usedIds: Set<string>;
}

function CounterGuide({ enemyPicks, heroes, usedIds }: CounterGuideProps) {
  const [activeLane, setActiveLane] = useState<Lane>("Jungle");

  const pickedEnemies = useMemo(
    () => enemyPicks.filter((s) => s.heroId).map((s) => getHeroById(heroes, s.heroId!)).filter(Boolean) as Hero[],
    [enemyPicks, heroes]
  );

  // For each lane, compute heroes sorted by counter score against ALL enemy picks
  const laneRankings = useMemo(() => {
    const result: Partial<Record<Lane, { hero: Hero; countersWhich: Hero[]; score: number }[]>> = {};
    for (const lane of LANES) {
      const candidates = heroes.filter(
        (h) => !usedIds.has(h.id) && h.lane.includes(lane)
      );
      const ranked = candidates
        .map((hero) => {
          const countersWhich = pickedEnemies.filter((ep) => hero.strongAgainst.includes(ep.id));
          const score = countersWhich.length * 15 + hero.winRate;
          return { hero, countersWhich, score };
        })
        .sort((a, b) => b.score - a.score);
      result[lane] = ranked;
    }
    return result;
  }, [heroes, usedIds, pickedEnemies]);

  const activeList = laneRankings[activeLane] ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Sword size={12} className="text-warning flex-shrink-0" />
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-warning">
          Counter Guide
        </h3>
        <span className="text-[10px] text-text-muted">
          — Best pick per lane vs {pickedEnemies.length} enemy hero{pickedEnemies.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Enemy picks summary chips */}
      {pickedEnemies.length > 0 && (
        <div className="flex gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
          <span className="text-[9px] text-text-muted self-center flex-shrink-0">vs:</span>
          {pickedEnemies.map((ep) => (
            <div key={ep.id} className="flex items-center gap-1 bg-danger/10 border border-danger/20 rounded px-1.5 py-1 flex-shrink-0">
              <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                <Image src={ep.image} alt={ep.name} fill sizes="64px" className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
              </div>
              <span className="text-[10px] font-display font-semibold text-danger">{ep.name}</span>
              <span className="text-[9px] text-text-muted">({ep.lane[0]})</span>
            </div>
          ))}
        </div>
      )}

      {/* Lane tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {LANES.map((lane) => {
          const list = laneRankings[lane] ?? [];
          const hasCounters = list.some((x) => x.countersWhich.length > 0);
          return (
            <button
              key={lane}
              type="button"
              onClick={() => setActiveLane(lane)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 px-2 py-2 text-center transition-colors border-b-2 flex-shrink-0",
                activeLane === lane
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/50"
              )}
            >
              <span className="text-sm leading-none">{LANE_ICON[lane]}</span>
              <span className="text-[10px] font-semibold">{lane}</span>
              {hasCounters && (
                <span className="text-[8px] text-success font-bold">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hero list for active lane */}
      <div className="p-3">
        {activeList.length === 0 ? (
          <p className="text-xs text-text-muted italic py-2">
            No available {activeLane} heroes (all picked or banned).
          </p>
        ) : (
          <div className="space-y-1.5">
            {activeList.slice(0, 8).map(({ hero, countersWhich, score }, idx) => (
              <LaneHeroRow
                key={hero.id}
                hero={hero}
                rank={idx + 1}
                countersWhich={countersWhich}
                totalEnemies={pickedEnemies.length}
                score={score}
              />
            ))}
            {activeList.length > 8 && (
              <p className="text-[10px] text-text-muted text-center pt-1">
                +{activeList.length - 8} more available
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LaneHeroRow({
  hero, rank, countersWhich, totalEnemies, score,
}: {
  hero: Hero;
  rank: number;
  countersWhich: Hero[];
  totalEnemies: number;
  score: number;
}) {
  const wrColor = hero.winRate >= 52 ? "#34D399" : hero.winRate >= 50 ? "#4F8EF7" : "#FBBF24";
  const counterCount = countersWhich.length;
  const isTopPick = rank === 1;
  const wrBarPct = Math.min(100, Math.max(0, (hero.winRate - 44) * 10));

  return (
    <div className={cn(
      "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
      isTopPick
        ? "border-success/40 bg-success/5"
        : "border-border bg-background/30 hover:bg-surface/60"
    )}>
      {/* Rank */}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
        isTopPick ? "bg-success text-background" : "bg-border text-text-muted"
      )}>
        {rank}
      </div>

      {/* Portrait */}
      <div className="relative w-9 h-9 flex-shrink-0 rounded overflow-hidden">
        <Image src={hero.image} alt={hero.name} fill sizes="64px" className="object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-display font-bold text-[13px]", isTopPick ? "text-success" : "text-text-primary")}>
            {hero.name}
          </span>
          <TierBadge tier={hero.tier} className="w-4 h-4 text-[7px]" />
          {hero.role.slice(0, 1).map((r) => <RoleBadge key={r} role={r} className="text-[8px] px-1 py-0" />)}
          {isTopPick && <span className="text-[9px] bg-success/15 text-success px-1.5 py-0 rounded-full font-bold">Best Pick</span>}
        </div>

        {/* Win rate bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${wrBarPct}%`, backgroundColor: wrColor }} />
            </div>
            <span className="text-[10px] font-mono font-semibold" style={{ color: wrColor }}>
              {hero.winRate.toFixed(1)}%
            </span>
          </div>

          {/* Counters summary */}
          {totalEnemies > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              {counterCount > 0 ? (
                <>
                  <span className="text-[9px] font-bold text-success flex-shrink-0">
                    ✓ counters {counterCount}/{totalEnemies}:
                  </span>
                  <span className="text-[9px] text-text-muted truncate">
                    {countersWhich.map((e) => e.name).join(", ")}
                  </span>
                </>
              ) : (
                <span className="text-[9px] text-text-muted">no direct counters</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pick Order Timeline ─────────────────────────────────────────
function PickOrderTimeline({ simStep, simSlots, heroes }: { simStep: number; simSlots: DraftSlot[]; heroes: Hero[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-2.5">
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Pick Order Timeline</p>
      <div className="flex gap-1 flex-wrap">
        {DRAFT_ORDER.map((action, i) => {
          const slot = simSlots[i];
          const hero = slot.heroId ? getHeroById(heroes, slot.heroId) : null;
          const isCurrent = i === simStep;
          const isPast = i < simStep;
          const accent = action.team === "blue" ? "#4F8EF7" : "#F87171";
          const isBan = action.type === "ban";

          return (
            <div key={i} className={cn("relative flex flex-col items-center gap-0.5 rounded border p-1 w-11 transition-all",
              isPast ? "opacity-80" : !isCurrent ? "opacity-30" : "")}
              style={isCurrent
                ? { borderColor: accent, boxShadow: `0 0 8px ${accent}50` }
                : isPast ? { borderColor: `${accent}40`, backgroundColor: `${accent}08` }
                : { borderColor: "#252A35" }}>
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-[8px] text-text-muted font-mono">{i + 1}</span>
              </div>
              {hero ? (
                <div className="relative w-8 h-8 rounded overflow-hidden">
                  <Image src={hero.image} alt={hero.name} fill sizes="64px"
                    className={cn("object-cover", isBan && "grayscale")}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/heroes/placeholder.webp"; }} />
                  {isBan && (
                    <div className="absolute inset-0 bg-danger/40 flex items-center justify-center">
                      <span className="text-danger text-xs font-bold">✕</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 rounded border border-dashed flex items-center justify-center"
                  style={isCurrent ? { borderColor: accent, color: accent } : { borderColor: "#252A35", color: "#64748B" }}>
                  <span className="text-[10px] font-bold">{isBan ? "B" : "P"}</span>
                </div>
              )}
              <span className="text-[7px] font-semibold uppercase"
                style={{ color: isCurrent ? accent : isPast ? `${accent}80` : "#64748B" }}>
                {isBan ? "ban" : "pick"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Draft Summary ───────────────────────────────────────────────
function DraftSummary({ heroes, bluePicks, redPicks }: { heroes: Hero[]; bluePicks: DraftSlot[]; redPicks: DraftSlot[] }) {
  const blueHeroes = bluePicks.map((s) => s.heroId ? getHeroById(heroes, s.heroId) : null).filter(Boolean) as Hero[];
  const redHeroes  = redPicks.map((s) => s.heroId ? getHeroById(heroes, s.heroId) : null).filter(Boolean) as Hero[];

  const blueAvgWr = blueHeroes.length ? blueHeroes.reduce((a, h) => a + h.winRate, 0) / blueHeroes.length : 50;
  const redAvgWr  = redHeroes.length  ? redHeroes.reduce((a, h) => a + h.winRate, 0)  / redHeroes.length  : 50;
  const cb = blueHeroes.reduce((a, h) => a + redHeroes.filter((r) => h.strongAgainst.includes(r.id)).length * 1.5, 0);
  const cr = redHeroes.reduce((a, h)  => a + blueHeroes.filter((b) => h.strongAgainst.includes(b.id)).length * 1.5, 0);
  const blueEst = Math.min(80, Math.max(20, blueAvgWr - redAvgWr + 50 + cb - cr));

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold font-display text-center text-text-primary">Draft Complete — Final Analysis</p>
      <div className="grid grid-cols-2 gap-2">
        <SummaryTeam label="Blue Team" accent="#4F8EF7" heroes={blueHeroes} winEst={blueEst} />
        <SummaryTeam label="Red Team"  accent="#F87171"  heroes={redHeroes}  winEst={100 - blueEst} />
      </div>
    </div>
  );
}

function SummaryTeam({ label, accent, heroes, winEst }: { label: string; accent: string; heroes: Hero[]; winEst: number }) {
  return (
    <div className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${accent}40` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold font-display" style={{ color: accent }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: accent }}>{winEst.toFixed(1)}%</span>
      </div>
      {heroes.map((h) => (
        <div key={h.id} className="flex items-center gap-1.5">
          <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
            <Image src={h.image} alt={h.name} fill sizes="64px" className="object-cover" />
          </div>
          <span className="text-[10px] font-display font-semibold truncate flex-1">{h.name}</span>
          <span className="text-[9px] font-mono text-success">{h.winRate.toFixed(1)}%</span>
          <TierBadge tier={h.tier} className="w-4 h-4 text-[8px]" />
        </div>
      ))}
    </div>
  );
}
