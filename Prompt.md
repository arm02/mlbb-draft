# MLBB Companion App — Cursor Composer Prompt
---

## PROMPT START

---

You are a senior fullstack engineer building a **Mobile Legends: Bang Bang Companion Web App** — a fast, keyboard-friendly tool used *during champion select* (30–60 second window). Every design and architecture decision must prioritize **speed of use**: minimal clicks, instant search, no bloat.

---

## Project Overview

**App name:** `mlbb-draft` (or choose a cool short name)
**Goal:** Help MLBB players make smarter picks and bans during draft phase.
**Users:** Solo/duo/team players on mobile or desktop, mid-game.

---

## Tech Stack

```
Framework   : Next.js 14 (App Router)
Language    : TypeScript (strict mode)
Styling     : Tailwind CSS + shadcn/ui (minimal components only)
State       : Zustand (lightweight, no Redux overhead)
Data layer  : Static JSON + SWR for client-side revalidation
Icons       : Lucide React
Fonts       : Inter (body) + Rajdhani (display/hero names) from Google Fonts
Deploy      : Vercel
```

---

## Data Architecture

### Primary Data Source
Use a **seeded static JSON file** at `/public/data/heroes.json` for hero metadata.  
Fetch win rate, counter, and tier data from the **unofficial MLBB community API**:

```
Base URL: https://api.mobile-legends.net  (or equivalent community dataset)
Fallback: https://mlbb.fandom.com/wiki scrape via /api/scrape route (server-side)
```

**If no reliable external API exists**, seed the data from this public GitHub dataset:
```
https://raw.githubusercontent.com/nicholasgasior/mlbb-data/master/heroes.json
```
...and supplement with a `/api/update-data` route (cron-able via Vercel Cron Jobs) that re-fetches and writes to a Vercel KV or Upstash Redis cache.

### Hero Data Shape (`Hero` type)
```typescript
interface Hero {
  id: string;              // "lesley"
  name: string;            // "Lesley"
  role: HeroRole[];        // ["Marksman"]
  lane: Lane[];            // ["Gold"]
  specialty: string[];     // ["Reap", "Damage"]
  tier: "S" | "A" | "B" | "C" | "D";
  winRate: number;         // 52.3 (percentage)
  pickRate: number;        // 8.1
  banRate: number;         // 4.2
  counters: string[];      // hero IDs that counter this hero
  counteredBy: string[];   // hero IDs this hero counters
  strongAgainst: string[]; // hero IDs this hero is strong against
  weakAgainst: string[];   // hero IDs this hero is weak against
  image: string;           // "/heroes/lesley.webp"
  patch: string;           // "1.8.94"
}

type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";
type Lane = "Exp" | "Gold" | "Mid" | "Jungle" | "Roam";
```

Store hero images in `/public/heroes/[id].webp` — download from MLBB wiki or CDN.

---

## Pages & Features

### 1. `/` — Home / Quick Draft (MAIN PAGE)
This is the primary screen. Everything is accessible from here without navigating away.

**Layout:**
```
┌─────────────────────────────────────────────┐
│  mlbb draft          [⚙ Settings]  [? Help] │
├─────────────────────────────────────────────┤
│  [COUNTER]  [WIN RATE]  [BAN]  [COMPARE]    │  ← Tab switcher, sticky top
├─────────────────────────────────────────────┤
│                                             │
│         ACTIVE TAB CONTENT                 │
│                                             │
└─────────────────────────────────────────────┘
```

Tabs are **instant** — no route change, pure Zustand tab state. Content lives in the same page.

---

### 2. Tab: Counter Picker

**Purpose:** User types/selects enemy hero → see which heroes counter them.

**UX Flow:**
1. **Search box** (auto-focused on tab load) — type hero name, instant filter
2. Hero grid appears filtered — click/tap hero card to select
3. Selected enemy heroes shown as chips (max 5 = full enemy team)
4. Below: **"Best Counters"** section — top 5 counter heroes per enemy pick, ranked by counter score
5. **"Team Counter"** — if 3–5 enemies selected, show heroes that counter the most enemies simultaneously

**Component breakdown:**
```
<CounterTab>
  <HeroSearchInput autoFocus />
  <HeroGrid filtered />
  <SelectedEnemies chips max={5} />
  <CounterResults>
    <CounterCard hero={} score={} countersCount={} />
  </CounterResults>
</CounterTab>
```

**Counter score algorithm:**
```typescript
// Simple scoring: count how many selected enemies this hero counters
function getCounterScore(heroId: string, enemyIds: string[]): number {
  const hero = getHero(heroId);
  return enemyIds.filter(e => hero.strongAgainst.includes(e)).length;
}
```

---

### 3. Tab: Win Rate Analyzer

**Purpose:** User selects their team's picks → get estimated win rate prediction.

**UX Flow:**
1. Pick up to 5 heroes for "My Team"
2. Optionally pick up to 5 heroes for "Enemy Team"
3. Show:
   - Average hero tier score
   - Individual hero win rates
   - Team composition analysis (do they have Tank? Carry? Support?)
   - Estimated win probability (weighted average + synergy bonus)
   - Missing roles warning (e.g., "⚠ No Tank picked")

**Win rate calculation:**
```typescript
function estimateWinRate(myTeam: Hero[], enemyTeam: Hero[]): number {
  const myAvg = average(myTeam.map(h => h.winRate));
  const enemyAvg = enemyTeam.length 
    ? average(enemyTeam.map(h => h.winRate)) 
    : 50;
  
  // Counter bonus: +1.5% per counter matchup in my favor
  const counterBonus = myTeam.reduce((acc, hero) => {
    return acc + enemyTeam.filter(e => hero.strongAgainst.includes(e.id)).length * 1.5;
  }, 0);

  return clamp(myAvg - enemyAvg + 50 + counterBonus, 20, 80);
}
```

Display as a **visual meter/gauge** — not just a number.

---

### 4. Tab: Ban Recommender

**Purpose:** Quickly show what heroes to ban this match.

**Inputs:**
- Current meta tier list (auto-loaded)
- Optional: Select your team's role composition to get context-aware bans

**Output:**
- Top 10 heroes to ban this patch
- Each with: Tier badge, ban rate %, win rate %, short reason ("High burst damage", "Snowballs hard")
- Filter by: All | By Role | OP This Patch

**Data:** Pull `banRate` and `tier === "S"` from heroes data. Sort by `(banRate * 0.6) + (winRate * 0.4)`.

---

### 5. Tab: Hero Compare

**Purpose:** Side-by-side comparison of 2 heroes.

**UX Flow:**
1. Two search inputs side by side (or stacked on mobile)
2. Type to search, select hero
3. Instant comparison table appears:
   - Win Rate, Pick Rate, Ban Rate
   - Role & Lane
   - Tier
   - Strengths vs weaknesses vs each other
   - "Who wins in a 1v1?" indicator (based on counter data)

**Layout (desktop):**
```
[Hero A Card]   vs   [Hero B Card]
─────────────────────────────────
Win Rate:   52.3%        48.1%    ← green highlight for winner
Pick Rate:   8.1%         5.2%
Tier:           S              A
Role:   Marksman      Assassin
...
─────────────────────────────────
[Hero A] counters [Hero B]? → YES / NO  (badge)
```

---

## UI / Design System

**Theme:** Dark only. No light mode (gaming context).

**Color palette:**
```
Background:    #0D0F14   (near-black with blue tint)
Surface:       #161920   (card backgrounds)
Border:        #252A35   (subtle dividers)
Primary:       #4F8EF7   (MLBB blue-ish accent)
Success:       #34D399   (win, counter advantage)
Warning:       #FBBF24   (medium tier, caution)
Danger:        #F87171   (ban, weak against)
Text Primary:  #F1F5F9
Text Muted:    #64748B
```

**Typography:**
```css
/* Display / Hero names */
font-family: 'Rajdhani', sans-serif;
font-weight: 600;

/* Body / UI */
font-family: 'Inter', sans-serif;
font-size: 14px; /* base — everything is compact */
```

**Spacing:** Dense. Use `p-2`, `p-3` max. Cards are compact. No excessive whitespace.

**Hero cards:** 64×64px thumbnail, name below, role badge. Tap = select. Hover = subtle glow.

**Interaction:**
- All search inputs: `autofocus` on mount
- Keyboard: `↑↓` to navigate hero grid, `Enter` to select, `Esc` to clear
- No modals — everything inline in the tab

**Mobile first:** Stack everything vertically. Bottom tab bar on mobile (fixed). Thumb-reachable.

---

## File Structure

```
mlbb-draft/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Main page (tabs)
│   ├── api/
│   │   ├── heroes/route.ts     # GET /api/heroes — serve cached hero data
│   │   └── update/route.ts     # POST /api/update — refresh data from source
├── components/
│   ├── tabs/
│   │   ├── CounterTab.tsx
│   │   ├── WinRateTab.tsx
│   │   ├── BanTab.tsx
│   │   └── CompareTab.tsx
│   ├── ui/
│   │   ├── HeroCard.tsx        # Reusable hero card (small/large variants)
│   │   ├── HeroSearch.tsx      # Autocomplete search
│   │   ├── HeroGrid.tsx        # Filterable grid
│   │   ├── TierBadge.tsx       # S/A/B/C/D badge
│   │   ├── RoleBadge.tsx       # Tank/Mage/etc
│   │   └── WinMeter.tsx        # Win probability gauge
│   └── layout/
│       ├── TabBar.tsx
│       └── Header.tsx
├── store/
│   └── useDraftStore.ts        # Zustand store (tab state, selections)
├── lib/
│   ├── heroes.ts               # Hero data fetching + caching
│   ├── counter.ts              # Counter score algorithms
│   ├── winrate.ts              # Win rate estimation logic
│   └── types.ts                # All TypeScript types
├── public/
│   ├── data/heroes.json        # Seeded hero data
│   └── heroes/                 # Hero images (.webp)
└── tailwind.config.ts
```

---

## Performance Requirements

- **First load:** < 1.5s (static data, no blocking API calls)
- **Hero search:** < 50ms response (client-side filter with `useMemo`)
- **Tab switch:** Instant (no fetch on tab change, preloaded)
- **Images:** Use `next/image` with `loading="lazy"` and fixed dimensions. WebP format only.
- **Bundle:** No heavy charting libraries. Win meter = pure CSS/SVG.

---

## Data Seeding Script

Create `/scripts/seed-heroes.ts`:
```typescript
// Run: npx ts-node scripts/seed-heroes.ts
// Fetches hero data from community source and writes to /public/data/heroes.json
// Also downloads hero thumbnails to /public/heroes/[id].webp
```
Use `node-fetch` and `sharp` for image optimization.

---

## Zustand Store Shape

```typescript
interface DraftStore {
  activeTab: "counter" | "winrate" | "ban" | "compare";
  setTab: (tab: DraftStore["activeTab"]) => void;

  // Counter tab
  enemyPicks: string[];        // hero IDs
  addEnemyPick: (id: string) => void;
  removeEnemyPick: (id: string) => void;

  // WinRate tab
  myTeam: string[];
  enemyTeam: string[];
  addToMyTeam: (id: string) => void;
  addToEnemyTeam: (id: string) => void;

  // Compare tab
  compareA: string | null;
  compareB: string | null;
  setCompareA: (id: string) => void;
  setCompareB: (id: string) => void;

  // Shared
  clearAll: () => void;
}
```

---

## Additional Instructions for Cursor

1. **Generate ALL files** in the structure above — no placeholders.
2. Use **real hero data** — seed with at least 20 meta heroes in `heroes.json` (Chou, Ling, Benedetta, Lesley, Beatrix, Fanny, Lancelot, Tigreal, Khufra, Mathilda, Valentina, Yve, Kagura, Esmeralda, Gusion, Karina, Paquito, Atlas, Diggie, Moskov).
3. Counter relationships must be **realistic** — e.g., Khufra counters Chou (anti-dash), Atlas counters Fanny (chain lock).
4. Build the **full WinRateTab** with the meter visualization as inline SVG — no library.
5. Make `HeroSearch` fully keyboard navigable with `useRef` and `onKeyDown`.
6. Ensure **mobile responsiveness** — test at 375px width, use bottom fixed `TabBar` on mobile.
7. Add `patch: "current"` indicator in the header so user knows data freshness.
8. Include a **"Reset Draft"** button (trash icon) in header — clears all Zustand state.
9. Use `next/font` for Rajdhani and Inter — no external Google Fonts CDN call.
10. Add `/api/update` endpoint with a simple token guard (`CRON_SECRET` env var) for Vercel Cron.

---

## START GENERATING

Begin with:
1. `package.json` + project setup
2. `lib/types.ts`
3. `public/data/heroes.json` (seeded data)
4. `store/useDraftStore.ts`
5. Then all components, then pages, then API routes.

Do not stop until all files are generated.
```

---

## Tips Setelah Generate

| Issue | Fix |
|---|---|
| Hero images 404 | Jalankan seed script, atau ganti dengan URL MLBB CDN langsung |
| Win rate data tidak akurat | Update `heroes.json` dari sumber seperti mlbb.gg setiap patch |
| Mau deploy | `vercel --prod`, set env `CRON_SECRET=xxx`, tambah cron job di `vercel.json` |
| Mau tambah fitur "Draft Simulator" | Prompt lanjutan: "Add a full 5v5 draft simulator mode with pick order" |