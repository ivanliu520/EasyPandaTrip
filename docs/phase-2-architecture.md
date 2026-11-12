# Phase 2 — Architecture Design Document

## China Travel Guide — Product Evolution

**Date:** 2026-10-27
**Baseline:** `6ad8a31 — chore: freeze phase 2 baseline`
**Status:** DESIGN ONLY — no implementation

---

## Part 1 — Existing Architecture Inspection

### A. Current Data Model

#### Guide Schema (`lib/types.ts:46-63`)
```typescript
GuideFrontmatter {
  slug, title, summary,
  category: "prepare" | "get-around" | "pay" | "daily-life",
  city_scope: "all" | "beijing" | "shanghai" | string[],
  target_audience: string[],
  estimated_minutes: number,
  last_verified: string, // ISO date
  status: "draft" | "verified" | "stale" | "outdated",
  sources: Source[],
  prerequisites?: Prerequisite[],
  steps: Step[],
  expected_result?: string,
  backup_options?: BackupOption[],
  common_problems?: string[], // problem slugs
  related_guides?: string[], // guide slugs
}
```
**Strengths:** Structured steps with visual cues and failure guidance; explicit problem cross-references; source attribution.
**Limitations:** No traveler-context fields; no conditional step logic; no weighted readiness scoring.

#### Problem Schema (`lib/types.ts:85-97`)
```typescript
ProblemFrontmatter {
  slug, title, summary,
  category: "payment" | "transport" | "internet" | "language" | "emergency" | "other",
  severity: "low" | "medium" | "high" | "emergency",
  last_verified, status, sources?, trigger_keywords?,
  diagnosis: DiagnosisNode[], // ordered tree
  related_guides?: string[],
}
DiagnosisNode {
  slug, question,
  options: DiagnosisOption[]
}
DiagnosisOption {
  label, recommended_action,
  backup_action?, escalate_to?, // next question slug
  emergency_option?,
}
```
**Strengths:** Clean two-step diagnosis tree; backup/backup/emergency layering; explicit escalation to next question.
**Limitations:** No context-based option filtering; no dynamic branching beyond `escalate_to`; no conditional visibility.

#### City Schema (`lib/types.ts:105-116`)
```typescript
CityFrontmatter {
  slug, title, summary,
  highlights?: string[],
  transport_notes?: string,
  payment_notes?: string,
  last_verified, status,
  related_guides?: string[],
  related_problems?: string[],
}
```
**Strengths:** Simple, focused; clear transport/payment guidance.
**Limitations:** No structured POI data; no hotel/airport fields; no seasonal info.

#### Checklist Schema (`lib/checklist.ts`)
```typescript
ChecklistAnswers {
  has_alipay, has_wechat_pay, has_internet_plan,
  has_map_app, has_cash_backup, has_chinese_phrases,
  has_hotel_address_cn, notes?
}
```
**Strengths:** Simple boolean flags; localStorage persistence; progress percentage.
**Limitations:** Hard-coded 7 questions; no weighted scoring; no category grouping; no task dependencies.

#### Search Index (`lib/content.ts:135-185`)
```typescript
SearchableItem {
  type: "guide" | "problem" | "city",
  slug, title, summary, category?, keywords?, url
}
```
**Strengths:** Client-side Fuse.js; natural-language token fallback; grouped results.
**Limitations:** No type-specific ranking boost; no intent detection; no synonym expansion.

#### Existing Types
- `ContentStatus`, `GuideCategory`, `ProblemCategory`, `Severity`, `CityCode`
- `Source`, `Step`, `Prerequisite`, `BackupOption`, `DiagnosisNode`, `DiagnosisOption`

#### Stateful/Client Components
- `ProblemSolver` — diagnosis navigation state (index, history, selected answer)
- `SearchClient` — query state, Fuse.js instance
- `ReadyPage` — checklist answers, localStorage
- `MobileNav` — open/close state

---

### B. Current Routing

| Route | Type | Params | Metadata | Sitemap |
|---|---|---|---|---|
| `/` | Static | — | Layout default | ✅ |
| `/guides` | Static | — | `title: "All Guides"` | ✅ |
| `/guides/[slug]` | Dynamic | `slug` | `generateMetadata()` per guide | ✅ |
| `/guides/category/[category]` | Dynamic | `category` | `generateMetadata()` per category | ✅ |
| `/problems` | Static | — | `title: "Fix a Problem"` | ✅ |
| `/problems/[slug]` | Dynamic | `slug` | `generateMetadata()` per problem | ✅ |
| `/cities` | Static | — | `title: "Cities"` | ✅ |
| `/cities/[city]` | Dynamic | `city` | `generateMetadata()` per city | ✅ |
| `/ready` | Static | — | `app/ready/layout.tsx` | ✅ |
| `/search` | Static | — | `title: "Search"` | ✅ |
| `/about` | Static | — | `title: "About"` | ✅ |
| `/sitemap.xml` | Dynamic | — | Generated | — |
| `/robots.txt` | Dynamic | — | Generated | — |

All dynamic routes use `generateStaticParams()` and `notFound()` for unknown slugs. Unknown params return real HTTP 404.

---

### C. Current ProblemSolver Architecture

**File:** `components/ProblemSolver.tsx`

**Data flow:**
1. Problem markdown frontmatter contains `diagnosis: DiagnosisNode[]`
2. `ProblemSolver` receives the full diagnosis array
3. Local state tracks: `currentIndex`, `selectedAnswer`, `history`
4. User clicks an option → `handleOptionClick` stores the answer and checks `escalate_to`
5. If `escalate_to` matches another node slug, jump to that node (with history push)
6. Otherwise, show answer with action/backup/emergency
7. "Still not solved? Next question →" advances to `currentIndex + 1`
8. "Start Over" resets all state

**Key properties:**
- No external state management (React `useState` only)
- No server round-trips during diagnosis
- No context awareness (same options for every traveler)
- History is linear (array of indices)
- No persistence of diagnosis path

---

## Part 2 — Traveler Context Model

### Proposed Minimal Model

```typescript
interface TravelerContext {
  // Identity (optional, low sensitivity)
  nationality?: string;           // e.g. "US", "DE", "JP"
  first_trip_to_china: boolean;   // true | false

  // Device & Connectivity (affects app recommendations)
  phone_os: "ios" | "android";    // affects app store links
  has_chinese_phone_number: boolean;

  // Payment readiness (affects payment problem diagnosis)
  alipay_ready: boolean;          // has account + linked card
  wechat_pay_ready: boolean;
  has_international_card: boolean; // Visa/Mastercard/Amex/etc.

  // Trip parameters (affects city content and timing)
  travel_cities: string[];        // e.g. ["beijing", "shanghai"]
  trip_duration_days?: number;    // affects eSIM data plan advice
  arrival_airport?: string;       // e.g. "PEK", "PVG"
}
```

### Field Analysis

| Field | Why it matters | Used by | Required? | Persisted? | Privacy risk |
|---|---|---|---|---|---|
| `nationality` | Visa requirements vary; some payment restrictions | ProblemSolver (payment), city pages | No | Optional | Low |
| `first_trip_to_china` | Determines guidance depth; first-timers need more hand-holding | Guides, Ready checklist, ProblemSolver | Yes (default: true) | Yes | Low |
| `phone_os` | App store links, APK availability, eSIM compatibility | Guides (internet, Alipay, WeChat), ProblemSolver | Yes | Yes | Low |
| `has_chinese_phone_number` | Affects registration flows for Alipay/WeChat | ProblemSolver (payment), guides | Yes | Yes | Low |
| `alipay_ready` | Skips setup steps; focuses on troubleshooting | ProblemSolver, Ready checklist | No | Yes | Low |
| `wechat_pay_ready` | Same as above | ProblemSolver, Ready checklist | No | Yes | Low |
| `has_international_card` | Determines if international card binding is viable | ProblemSolver (payment), guides | Yes | Yes | Low |
| `travel_cities` | Filters city-specific content; affects readiness score | Ready, city pages, search | Yes | Yes | Low |
| `trip_duration_days` | eSIM data plan sizing; visa type hints | Ready, internet guide | No | Yes | Low |
| `arrival_airport` | Airport-specific transport advice | City pages, transport guide | No | Yes | Low |

**Privacy assessment:** All fields are low-sensitivity. No passport numbers, no names, no exact travel dates. `nationality` is the most sensitive but still standard travel metadata. All data can live in localStorage; no server transmission required.

**Smallest useful model for Phase 2 MVP:**
```typescript
interface TravelerContext {
  first_trip_to_china: boolean;
  phone_os: "ios" | "android";
  has_chinese_phone_number: boolean;
  alipay_ready: boolean;
  wechat_pay_ready: boolean;
  has_international_card: boolean;
  travel_cities: string[];
}
```

---

## Part 3 — Context → Recommendation Layer

### Architecture

```
┌─────────────────┐
│  TravelerContext │  (localStorage, user-provided)
│  (JSON object)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DecisionRules   │  (pure functions, deterministic)
│  (lib/rules.ts)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ProblemSolver   │  (enhanced with context-aware option filtering)
│  or Ready        │  (enhanced with category scoring)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Recommendation  │  (filtered/sorted content)
│  (guide/problem/ │  (city/action)
│   city/action)   │
└─────────────────┘
```

### Ownership Boundaries

| Layer | Owns | Does NOT own |
|---|---|---|
| **Application** | Context schema, rule evaluation, option filtering, state management | Human-readable text, factual claims, URLs |
| **Content** | Instructions, explanations, tips, warnings, backup steps, sources | Conditional logic, branching rules, eligibility checks |
| **DecisionRules** | Pure functions: `(context, content) → filtered/sorted content` | Persistence, UI rendering, side effects |

### Example Rule

```typescript
// lib/rules.ts — pure, testable, no side effects
function getPaymentProblemOptions(
  context: TravelerContext,
  diagnosis: DiagnosisNode[]
): DiagnosisNode[] {
  return diagnosis.map(node => ({
    ...node,
    options: node.options.filter(opt => {
      // If traveler has no international card, hide "Add international card" option
      if (!context.has_international_card && opt.label.includes("international card")) {
        return false;
      }
      // If Alipay is not ready, boost "Set up Alipay first" to top
      return true;
    }).sort((a, b) => {
      if (!context.alipay_ready && a.label.includes("Alipay")) return -1;
      return 0;
    })
  }));
}
```

**Content side:** The problem markdown still contains ALL options. The app filters/reorders at render time based on context. No content duplication.

---

## Part 4 — ProblemSolver Upgrade

### What Changes Are Necessary

| Feature | Current | Phase 2 |
|---|---|---|
| Diagnosis tree | Static frontmatter | Same, but filtered by context |
| Option visibility | All shown | Context-aware filtering |
| Option ordering | Frontmatter order | Context-aware reordering |
| Backup action | Shown if present | Same |
| Escalation | `escalate_to` slug | Same |
| Related guides | Listed at bottom | Context-aware ranking |
| State persistence | None (in-memory) | Optional localStorage for diagnosis path |

### What Does NOT Change

- `DiagnosisNode` schema (no new fields)
- `ProblemSolver` component architecture (still client-side, still `useState`)
- Markdown content format
- Problem slugs or routes
- `escalate_to` mechanism

### Minimal Enhancement

Add a `context` prop to `ProblemSolver` and pass it through a filter function:

```typescript
// Before rendering options
const filteredOptions = applyContextRules(currentNode.options, travelerContext);

// In the option list
{filteredOptions.map((opt, i) => ...)}
```

**No generic workflow engine needed.** The existing two-step diagnosis + `escalate_to` is sufficient for all current content.

---

## Part 5 — Get Ready Evolution

### Current State
- 7 hard-coded boolean questions
- Simple percentage: `done / total`
- Missing tasks listed with guide links
- localStorage persistence

### Phase 2: Trip Readiness

**Readiness Categories:**

```typescript
type ReadinessCategory = "payment" | "internet" | "transport" | "language" | "emergency";

interface ReadinessScore {
  category: ReadinessCategory;
  score: number;        // 0-100
  completed: string[];  // task ids
  missing: ChecklistTask[];
}
```

**Scoring Model:**

| Category | Weight | Tasks | Max Points |
|---|---|---|---|
| Payment | 30% | Alipay ready, WeChat ready, international card | 30 |
| Internet | 25% | eSIM/VPN plan, map app | 25 |
| Transport | 20% | Metro knowledge, DiDi installed | 20 |
| Language | 15% | Basic phrases, translation app | 15 |
| Emergency | 10% | Cash backup, hotel address in Chinese | 10 |

**Task Completion Model:**
- Each task maps to 1+ readiness categories
- Some tasks are binary (done/not done)
- Some tasks have quality levels (e.g., "Alipay linked to international card" > "Alipay installed")

**Relationship to Guides:**
- Each missing task links to its guide
- Guide completion updates readiness (optional: user marks "I've done this")

**Relationship to Traveler Context:**
- `alipay_ready` and `wechat_pay_ready` feed directly into Payment score
- `travel_cities` determines which transport tasks are relevant
- `has_chinese_phone_number` affects difficulty rating of payment tasks

**Persistence:**
- Continue using localStorage
- Add `ctg-readiness-v1` key alongside existing `ctg-checklist-v1`
- No server sync in Phase 2

**First Implementation:**
Keep it simple. Reuse the existing 7 questions but:
1. Group them by category
2. Show category scores, not just overall percentage
3. Highlight the weakest category
4. Keep the same localStorage schema (add `notes` field if needed)

---

## Part 6 — Search Evolution

### Current State
- Fuse.js client-side search
- Indexes guides, problems, cities
- Groups results by type
- Natural-language token fallback

### Phase 2 Enhancement

**Goal:** Distinguish intent and route to the right content type.

**No AI required.** Deterministic keyword matching + existing Fuse.js is sufficient.

**Intent Detection (rule-based):**

```typescript
type SearchIntent = "learn" | "fix" | "navigate" | "general";

function detectIntent(query: string): SearchIntent {
  const q = query.toLowerCase();
  if (q.includes("not working") || q.includes("failed") || q.includes("error") || q.includes("can't")) return "fix";
  if (q.includes("how to") || q.includes("how do i") || q.includes("setup") || q.includes("install")) return "learn";
  if (q.includes("where") || q.includes("address") || q.includes("station") || q.includes("airport")) return "navigate";
  return "general";
}
```

**Ranking Changes:**
- If intent = "fix": boost `type: "problem"` results
- If intent = "learn": boost `type: "guide"` results
- If intent = "navigate": boost `type: "city"` results

**Result Model:**
```typescript
interface SearchResult extends SearchableItem {
  intent?: SearchIntent;
  score: number;
  actionLabel?: string;  // e.g. "Fix this problem →" vs "Learn how →"
}
```

**No changes to content model.** Search index is built from existing frontmatter.

---

## Part 7 — Data Persistence Decision

### Option Comparison

| Factor | A: No DB (local only) | B: Anonymous local context | C: Auth + persistent profile |
|---|---|---|---|
| **Complexity** | Low (localStorage) | Low-Medium (localStorage + schema) | High (Supabase, auth, RLS, migrations) |
| **User value** | Basic (session-only) | Medium (returning users see progress) | High (cross-device sync) |
| **Privacy** | Best (no data leaves device) | Good (data stays local) | Requires privacy policy, data handling |
| **Extensibility** | Limited | Good foundation for C later | Full feature set |
| **Necessary now?** | Yes for MVP | Yes for Phase 2 | No — premature for current scale |

### Recommendation: **Option B — Anonymous local traveler context**

**Rationale:**
- Phase 2 MVP needs context to personalize ProblemSolver and Ready
- No need for accounts to deliver core value
- Keeps privacy simple (no PII collection)
- Can upgrade to Option C later without breaking changes (migrate localStorage → Supabase)

**Implementation:**
- Extend existing `lib/checklist.ts` pattern
- New key: `ctg-traveler-context-v1`
- JSON blob in localStorage
- No expiration (user can clear via browser)

---

## Part 8 — AI Decision

| Feature | Classification | Rationale |
|---|---|---|
| AI-generated recommendations | **Phase 3** | Content is curated and verified; AI could introduce hallucinations |
| Semantic search | **Phase 3** | Fuse.js + keyword matching is sufficient for 12 content items |
| Natural-language problem input | **Phase 2 later** | Could map free text to problem slugs; needs more content to be useful |
| AI travel assistant | **Do not build yet** | Scope creep; no clear advantage over structured guides |
| Translation assistance | **Phase 3** | Would require real-time API integration; out of scope for static site |

**Phase 2 MVP: No AI.**

---

## Part 9 — Architecture Proposal

### Module Map

```
app/
├── layout.tsx                 # Unchanged
├── page.tsx                   # Minor: pass context to featured guides?
├── globals.css                # Unchanged
├── sitemap.ts                 # Unchanged
├── robots.ts                  # Unchanged
├── guides/
│   ├── page.tsx               # Unchanged
│   ├── [slug]/
│   │   └── page.tsx           # Minor: context-aware guide filtering?
│   └── category/
│       └── [category]/
│           └── page.tsx       # Unchanged
├── problems/
│   ├── page.tsx               # Unchanged
│   └── [slug]/
│       └── page.tsx           # Minor: pass context to ProblemSolver
├── cities/
│   ├── page.tsx               # Unchanged
│   └── [city]/
│       └── page.tsx           # Unchanged
├── ready/
│   ├── layout.tsx             # Unchanged
│   └── page.tsx               # Enhanced: category scoring, context integration
├── search/
│   └── page.tsx               # Minor: intent detection, action labels
└── about/
    └── page.tsx               # Unchanged

components/
├── MobileNav.tsx              # Unchanged
├── ProblemSolver.tsx          # Enhanced: context prop, option filtering
├── SearchClient.tsx           # Enhanced: intent detection, action labels
├── Markdown.tsx               # Unchanged
└── Shared.tsx                 # Unchanged

lib/
├── types.ts                   # Extended: TravelerContext, ReadinessScore
├── content.ts                 # Unchanged
├── search.ts                  # Enhanced: intent detection, ranking
├── checklist.ts               # Enhanced: category scoring
└── rules.ts                   # NEW: pure decision rules

content/                       # Unchanged (no schema changes needed)
```

### Data Flow

```
User opens site
    ↓
TravelerContext loaded from localStorage (or defaults)
    ↓
┌─────────────────────────────────────────┐
│  If on /ready:                          │
│    Show category scores                 │
│    Highlight weakest category           │
│    Link to relevant guides              │
├─────────────────────────────────────────┤
│  If on /problems/[slug]:                │
│    ProblemSolver receives context       │
│    Filter/reorder options by context    │
│    Show context-appropriate backup      │
├─────────────────────────────────────────┤
│  If on /search:                         │
│    Detect intent from query             │
│    Boost matching content type          │
│    Show action-oriented labels          │
└─────────────────────────────────────────┘
    ↓
User completes action / reads guide
    ↓
Optionally update TravelerContext (e.g. "alipay_ready = true")
    ↓
Persist to localStorage
```

---

## Part 10 — Phase 2 MVP Scope

### Must Have

1. **TravelerContext model + persistence**
   - 7-field minimal model (first_trip, phone_os, has_chinese_number, alipay_ready, wechat_pay_ready, has_international_card, travel_cities)
   - localStorage persistence
   - Default values for new users

2. **Context-aware ProblemSolver**
   - Filter payment options based on `alipay_ready`, `wechat_pay_ready`, `has_international_card`
   - Reorder options to surface most relevant first
   - No content schema changes

3. **Enhanced Ready page**
   - Category-based scoring (Payment, Internet, Transport, Language, Emergency)
   - Show score per category
   - Highlight weakest category
   - Keep existing 7 questions

4. **Search intent detection**
   - Rule-based intent classification (fix/learn/navigate)
   - Type boosting based on intent
   - Action-oriented result labels

### Should Have

5. **Guide context hints**
   - On guide pages, show "Based on your profile: ..." if context is relevant
   - E.g., "Since you don't have a Chinese phone number, see Step 2 alternative"

6. **Context editor**
   - Simple form on `/ready` to set traveler context
   - No separate page needed

### Later

7. **Cross-device sync** (Option C)
8. **More cities** (Guangzhou, Shenzhen, Chengdu)
9. **More problems** (train booking, hotel check-in, SIM card issues)
10. **PDF export of personalized checklist**

### Explicitly Out of Scope

- User accounts / authentication
- Server-side database
- AI/LLM integration
- Real-time translation
- Booking integrations
- Multi-language UI
- Mobile app

---

## Part 11 — Implementation Plan

### Batch 2B.1 — Traveler Context Foundation

**Objective:** Add TravelerContext type, localStorage persistence, and context editor UI.

**Files:**
- `lib/types.ts` — add `TravelerContext`, `ReadinessCategory`, `ReadinessScore`
- `lib/traveler-context.ts` — NEW: load/save/default functions
- `app/ready/page.tsx` — add context editor section (collapsible)

**Schema changes:** None (content files unchanged)

**Dependencies:** None

**Validation:**
- TypeScript compiles
- ESLint passes
- localStorage read/write works
- Defaults render correctly on first visit

**Acceptance criteria:**
- User can set 7 context fields
- Context persists across page refreshes
- No hydration errors

---

### Batch 2B.2 — Context-Aware ProblemSolver

**Objective:** Filter and reorder ProblemSolver options based on TravelerContext.

**Files:**
- `lib/rules.ts` — NEW: pure decision rules
- `components/ProblemSolver.tsx` — accept `travelerContext` prop, apply rules
- `app/problems/[slug]/page.tsx` — load context, pass to ProblemSolver

**Schema changes:** None

**Dependencies:** Batch 2B.1

**Validation:**
- All 5 problems render correctly with default context
- Payment problem shows different option order when `alipay_ready=true` vs `false`
- No dead ends introduced
- Start Over still works

**Acceptance criteria:**
- `alipay_ready=false` → "Set up Alipay" option appears first
- `has_international_card=false` → international card option hidden
- All existing content still renders

---

### Batch 2B.3 — Ready Page Category Scoring

**Objective:** Evolve `/ready` from flat checklist to category-based readiness.

**Files:**
- `lib/checklist.ts` — add category mapping and scoring
- `app/ready/page.tsx` — category score display, weakest-category highlight

**Schema changes:** None

**Dependencies:** Batch 2B.1

**Validation:**
- Category scores sum correctly
- Weakest category is highlighted
- Guide links still work
- Mobile layout unchanged

**Acceptance criteria:**
- Payment score = 0% when neither Alipay nor WeChat ready
- Overall score = weighted average
- Visual design matches existing style

---

### Batch 2B.4 — Search Intent & Action Labels

**Objective:** Add intent detection and type-specific action labels to search.

**Files:**
- `lib/search.ts` — add `detectIntent()`, modify `search()` to accept intent boost
- `components/SearchClient.tsx` — use intent, show action labels

**Schema changes:** None

**Dependencies:** None

**Validation:**
- "alipay not working" → problem results first
- "how to use alipay" → guide results first
- "beijing metro" → city/guide results appropriately ranked

**Acceptance criteria:**
- Intent detection covers 80% of common query patterns
- Action labels are descriptive ("Fix this →", "Learn how →", "City tips →")

---

### Batch 2B.5 — Final Validation & Freeze

**Objective:** Full regression test and Phase 2 baseline freeze.

**Files:** All modified files

**Validation:**
- TypeScript, ESLint, build
- Content validator (12 files, 0 issues)
- Route smoke test (all valid routes 200, all invalid routes 404)
- SEO check (no duplicate titles, unique metadata)
- Traveler smoke test (7 tasks)
- Mobile UX check

**Acceptance criteria:**
- All validations pass
- Working tree clean
- Single baseline commit

---

## Final Decision Summary

| Decision | Recommendation |
|---|---|
| **Architecture** | Extend existing static site with client-side context layer; no backend changes |
| **Persistence** | **Option B** — Anonymous localStorage traveler context (`ctg-traveler-context-v1`) |
| **AI strategy** | **No AI in Phase 2.** Rule-based intent detection and context filtering only. |
| **MVP scope** | Traveler context + context-aware ProblemSolver + category-based Ready + search intent |
| **Implementation** | 5 batches: 2B.1 (context) → 2B.2 (solver) → 2B.3 (ready) → 2B.4 (search) → 2B.5 (freeze) |
| **Risks** | Over-engineering context model; adding too many fields; breaking existing content |
| **Do NOT build yet** | Auth, database, AI, mobile app, multi-language, booking integrations |

---

*End of design document.*
