# RepWizard — "Plan" Tab Redesign
## UI/UX Specification: Program Builder Hub
### Supersedes: Current "Coach" tab implementation (screenshot reference: v0.1 chat interface)

---

## The Problem with the Current Design

The current "Coach" tab has the following critical UX failures:

| Issue | Why It Fails |
|---|---|
| Tab named "Coach" | Frames the AI as the protagonist. Users come to build programs, not chat with an AI. |
| "Programs" and "Library" as top chips | These are navigation destinations masquerading as filters. They don't belong as orphaned chips on a content screen. |
| Centered text block listing AI capabilities | Communicates "chatbot waiting for input" — not "program builder ready to use." |
| Empty canvas with no user context | A first-time user has no idea what to do. A returning user sees nothing about their existing programs or goals. |
| AI introduced by name and capability | The AI's role should be demonstrated through intelligent scaffolding, not announced in a welcome panel. |

**Core reframe:** The user is building a training program. AI is an advisor that makes that process smarter — not a chat product they visit to get answers. The tab should feel like a **program builder studio**, not a messaging app.

---

## Tab Rename: "Coach" → "Plan"

**Rationale:** "Plan" is concrete, action-oriented, and user-centric. It describes what the user is doing (planning their training), not who is helping them. Other options considered:

| Name | Verdict |
|---|---|
| Coach | ❌ AI-centric, not user-centric |
| Train | ❌ Conflicts with "Today" (active training) |
| Programs | ❌ Too narrow — doesn't include goals or library |
| Build | ❌ Sounds like a dev tool |
| **Plan** | ✅ Action-oriented, clear, maps to user's mental model |

Update the Shell tab label, icon (suggest: `calendar_add_on` or `fitness_center` + checkmark), and all route references from `//coach` to `//plan`.

---

## Redesigned Tab: "Plan" Hub

### Mental Model

The Plan tab is a **program creation and management studio**. It has three modes that flow naturally into each other:

1. **Hub (default)** — shows the user's current state: active program, goals, and entry points into creation
2. **Builder** — step-by-step program creation flow (quick-start or custom)
3. **Library** — exercise database, browsable during program building (not a top-level destination)

The AI advisor surface is **embedded** into the Builder and Hub — it surfaces suggestions contextually, not as a chat window the user has to navigate to.

---

## Screen Layout: Plan Hub (Default State)

### Information Hierarchy

1. **Active Program status** (if one exists) — what week am I on, what's next
2. **Goals** — long-term goal + short-term current focus
3. **Create / Modify program** — primary CTA
4. **Quick-start templates** — reduce friction for new users
5. **AI suggestions** — contextual, not a chat button

### Zone Layout (M3E, 4pt grid)

```
┌─────────────────────────────────────┐
│  Context Header                      │  ~ 8%
│  "Your Training Plan"  [Edit Goals]  │
├─────────────────────────────────────┤
│                                      │
│  Active Program Card                 │  ~ 22%
│  (or "No Program" empty state)       │
│                                      │
├─────────────────────────────────────┤
│  Goals Strip                         │  ~ 12%
│  Long-term goal chip | Short-term    │
├─────────────────────────────────────┤
│                                      │
│  [ + Create New Program ]            │  ~ 10%
│    Primary Extended FAB              │
│                                      │
├─────────────────────────────────────┤
│  Quick-Start Templates               │  ~ 28%
│  Horizontal scroll cards             │
│  (3–5 science-based templates)       │
│                                      │
├─────────────────────────────────────┤
│  AI Insight Banner                   │  ~ 12%
│  Contextual suggestion, not a CTA    │
│  to open a chat window               │
├─────────────────────────────────────┤
│  Bottom Navigation                   │  ~ 8%
│  Today | Progress | Plan             │
└─────────────────────────────────────┘
```

---

## Component Specifications

### A. Context Header

- **Label:** "Your Training Plan" (not "RepWizard Coach")
- **Right action:** "Edit Goals" text button → navigates to Goals screen (not a modal)
- **Style:** Tonal surface container, low elevation — consistent with home screen header
- **No AI branding, no capability listings**

---

### B. Active Program Card

This is the most important element for returning users. It must answer three questions instantly: *What program am I on? Where am I in it? What's next?*

**When a program is active:**

```
┌─────────────────────────────────────────┐
│  💪  Push / Pull / Legs  —  Week 3 of 8  │
│  ────────────────────────────────────── │
│  Progress bar: ████████░░░░  37%        │
│                                          │
│  Next: Lower Body A  ·  Tomorrow        │
│                                          │
│  [View Program]          [Modify]        │
└─────────────────────────────────────────┘
```

- **Component:** M3E tonal surface card — NOT elevated card (no drop shadow)
- **Progress bar:** Same arc/bar component language as home screen weekly progress
- **"Modify" action:** Opens the Builder in edit mode for the active program
- **Corner radius:** 16–20dp (expressive but not pill)
- **AI integration (subtle):** If the AI detects the user is behind schedule or volume is trending low, a single-line insight appears below the progress bar — e.g., *"You're 1 session behind this week — consider a catch-up day."* No chat button. No navigation required.

**When no program exists (empty state — first-time or after completing a program):**

```
┌─────────────────────────────────────────┐
│                                          │
│       No active program                  │
│   Build one below, or pick a             │
│   quick-start template to begin.         │
│                                          │
└─────────────────────────────────────────┘
```

- Minimal. No illustration overload.
- The empty state guides the eye downward to the CTA and templates — it does not try to fill the space.

---

### C. Goals Strip

Goals are **not** on this screen in full edit form — they live on a dedicated Goals screen. This strip surfaces the current goals as read-only context chips so the user understands why their program suggestions look the way they do.

```
Long-term:  [ 🏆  Build muscle — 6 months ]
Short-term: [ 🎯  Add 20lb to squat — 8 wks ]
```

- **Component:** Two M3E filter chips, read-only style, tonal fill
- **Tap behavior:** Both chips navigate to `//plan/goals` — not inline edit
- **If no goals set:** Single chip reading "Set your goals →" in tertiary color — gentle nudge, not alarming

**Goals Screen (`//plan/goals`) — separate page, not modal:**

The Goals screen is where the user sets:

| Goal Type | Description | Example |
|---|---|---|
| **Long-term goal** | Primary fitness objective + timeframe | "Build muscle mass — 6 months" |
| **Short-term focus** | Specific near-term target | "Increase squat 1RM by 20lb in 8 weeks" |
| **Constraints** | Days/week available, session length, equipment | "4 days, 60 min, full gym" |
| **Limitations** | Injury notes, movement restrictions | "Left shoulder impingement — no overhead press" |

After the user saves goals, the AI generates a brief "Goal Analysis" card (one paragraph, not a chat message) that explains:
- What training style best fits these goals
- Realistic timeline assessment
- Key training variables to prioritize
- Any conflicts it notices (e.g., "Fat loss + maximum strength gain simultaneously is difficult — here's how to prioritize...")

This analysis is displayed inline on the Goals screen and refreshes when goals change. It is **not** a chat session.

---

### D. Primary CTA — Create New Program

- **Component:** Extended FAB, M3E expressive style
- **Label:** `+ CREATE PROGRAM`
- **Placement:** Full-width or near-full-width, below the Goals Strip
- **Elevation:** Highest on this screen
- **Corner radius:** 28–36dp
- **Tap behavior:** Opens the Program Builder flow (see Section: Builder Flow below)

---

### E. Quick-Start Templates

Horizontal scroll row of pre-built, science-based program templates. These are **not** random generic templates — each one is grounded in a specific periodization model or population need and labeled accordingly.

**Required templates at launch:**

| Template Name | Target | Structure | Science Basis |
|---|---|---|---|
| **3-Day Full Body** | Beginners, general fitness | 3×/week full body | Motor learning priority; Rippetoe / NSCA beginner principles |
| **Push / Pull / Legs** | Intermediate, hypertrophy | 6-day PPL or 3-day abbreviated | RP MEV/MAV volume distribution |
| **Upper / Lower Split** | Intermediate, strength + size | 4-day upper/lower | Frequency 2× per muscle group; Schoenfeld frequency research |
| **5/3/1 Strength** | Intermediate–Advanced, strength | 4-day main lift focus | Wendler 5/3/1 periodization |
| **Hypertrophy Block** | Intermediate, muscle growth | 4–5 day, high volume | Block periodization; accumulation → intensification |

**Card design (horizontal scroll):**

```
┌──────────────────────┐  ┌──────────────────────┐
│  3-Day Full Body      │  │  Push / Pull / Legs   │
│                       │  │                       │
│  ●●●○○○○  Beginner    │  │  ●●●●○○○  Intermed.  │
│  3 days/week          │  │  6 days/week          │
│  ~45 min/session      │  │  ~60 min/session      │
│                       │  │                       │
│  "Best for building   │  │  "Classic hypertrophy │
│   the habit and       │  │   split with clear    │
│   movement patterns"  │  │   push/pull balance"  │
│                       │  │                       │
│  [ Start This ]       │  │  [ Start This ]       │
└──────────────────────┘  └──────────────────────┘
```

- **Component:** M3E tonal surface cards, fixed width (~200dp), horizontal `CollectionView`
- **Difficulty indicator:** Dot-fill row (filled dots = difficulty level, 1–5)
- **"Start This" button:** Tonal button, opens the template in Builder for customization before activation — **never activates a template directly without review**
- **AI annotation:** Each card has a single-line AI note beneath the description explaining why this might or might not fit the user's current goals — this is populated by `AiContextBuilder` using the user's goal data, not hardcoded

---

### F. AI Insight Banner

This replaces the chat interface as the primary AI touchpoint on the hub. It is a **single contextual insight**, not a chat button.

```
┌─────────────────────────────────────────────────┐
│  ✦ Based on your goal and recent volume,        │
│    a 4-day Upper/Lower split would hit your     │
│    target muscle groups 2× per week — optimal  │
│    for your intermediate level.                 │
│                                          [Ask →] │
└─────────────────────────────────────────────────┘
```

- **Component:** M3E tonal surface banner, tertiary color accent on the ✦ icon
- **Content:** Generated by `AiContextBuilder` — pulls user goal, experience level, recent workout data, and current program status to produce a single actionable insight
- **Refresh:** Updates when user returns to the Plan tab (not on a timer)
- **[Ask →] button:** Opens the AI conversation screen (`//plan/ai-chat`) — this is the ONLY path to the chat interface, and it's subordinate, not primary
- **If no data exists:** Banner is hidden entirely — do not show a generic message

---

## Program Builder Flow (`//plan/builder`)

The Builder is a **guided multi-step flow**, not a single form. It is entered from:
- `+ CREATE PROGRAM` CTA (new program)
- "Start This" on a quick-start template (template customization)
- "Modify" on the active program card (edit mode)

### Builder Steps

```
Step 1: Goal Confirmation
  └─ Shows current goals, asks user to confirm or adjust for this program
  └─ AI generates a one-line recommendation: "For hypertrophy, I recommend 4–5 days"

Step 2: Structure Selection
  └─ Days per week (stepper: 2–6)
  └─ Session length (slider: 30–90 min)
  └─ Split type (chip selection: Full Body / Upper-Lower / PPL / Custom)
  └─ Duration (stepper: 4–16 weeks)
  └─ AI advisory inline: "At your level, 4 days with Upper/Lower gives optimal frequency"

Step 3: Exercise Selection
  └─ Auto-populated based on split + goals from Exercise Library
  └─ User can swap, add, or remove any exercise
  └─ Each exercise shows: muscle group, equipment, difficulty, and an AI note
     if it conflicts with user limitations or is suboptimal for their goal
  └─ Library search accessible via bottom sheet — not a separate navigation destination

Step 4: Volume & Progression
  └─ Sets per exercise (stepper per exercise, or "use recommended")
  └─ Rep range target (chip: Strength 1–5 / Hypertrophy 6–12 / Endurance 12–20)
  └─ Progression rule per exercise (auto or manual)
  └─ Deload week configuration (auto every N weeks, or manual)
  └─ AI validates total weekly volume against MEV/MAV landmarks and flags if over/under

Step 5: Review & Activate
  └─ Full program summary: week-by-week view, volume per muscle group chart
  └─ AI "Program Analysis" paragraph: explains what the program is designed to do,
     key progressions to watch, and any caveats
  └─ [Activate Program] primary CTA
  └─ [Save as Draft] secondary action
  └─ [Ask a Question] tertiary link → opens AI chat with program context pre-loaded
```

### Builder AI Integration Rules

The AI appears in the Builder as **inline advisory text** — not as a chat panel, not as a blocking modal.

- Advisory text appears below relevant input controls
- It is generated on-demand when the user changes a value that affects program quality
- It uses the `ProgramValidator` constraints from section 6.5 of the main spec to determine what to surface
- Tone: direct, brief, one or two sentences max. Example: *"At 22 sets/week for chest, you're approaching your MRV. Consider reducing to 18–20 for sustainable progress."*
- The user can dismiss any advisory text — it should never block progression through the builder steps

---

## AI Chat Screen (`//plan/ai-chat`)

The chat interface **still exists** but is now a secondary, opt-in surface — not the landing page.

### Changes from current implementation:

- **Entry points:** Only accessible via `[Ask →]` on the insight banner, `[Ask a Question]` in the builder review step, or a small "Ask Coach" icon in the top-right of the Plan hub header
- **Context pre-loading:** When opened from the builder or hub, the AI conversation is pre-loaded with the user's full context (goals, current program, recent workouts) — the user does not need to explain themselves
- **No top navigation chips** ("Programs", "Library" disappear from this screen entirely)
- **Header:** "Ask Your Coach" — simple, direct. No capability listing in the empty state.
- **Empty state:** Single line: *"What would you like to work on?"* — not a feature advertisement
- **Conversation history:** Accessible via a history icon in the header (not a top chip)

---

## Navigation Restructure

### Remove
- Top-of-screen navigation chips ("Programs", "Library", "+ New") — these are not M3E pattern and create navigation confusion

### Replace with
- All sub-destinations accessible via the hub layout itself or through in-flow navigation
- Programs are managed from the Active Program Card and the Builder
- Library is accessible as a bottom sheet during Builder exercise selection — not a top-level tab destination

### Updated Shell Routes

| Route | Screen | Entry Point |
|---|---|---|
| `//plan` | Plan Hub | Tab bar |
| `//plan/goals` | Goals Editor | "Edit Goals" header button or Goals chips |
| `//plan/builder` | Program Builder (new) | "+ Create Program" CTA |
| `//plan/builder/{templateId}` | Program Builder (from template) | Quick-start "Start This" |
| `//plan/builder/{programId}/edit` | Program Builder (edit mode) | Active Program "Modify" |
| `//plan/program/{id}` | Program Detail View | Active Program "View Program" |
| `//plan/ai-chat` | AI Chat | "Ask →" banner, builder review step |
| `//plan/ai-chat/{conversationId}` | AI Chat (existing conversation) | Chat history |

**Remove:** `//coach`, `//coach/programs`, `//coach/library` (these routes no longer exist as standalone destinations)

---

## M3E Design Rules for This Screen

Inherits all rules from Section 13 of the main spec, plus these tab-specific additions:

- **No chat UI on the hub.** The hub is a studio, not a messaging app. The chat input bar must not appear on `//plan` — only on `//plan/ai-chat`.
- **Cards on the hub use tonal surface, not elevated cards.** The Active Program card, Quick-start cards, and Insight banner all use tonal containers. Elevation is reserved for the primary CTA only.
- **The Quick-start template scroll must use snap scrolling** so cards land cleanly — not a freeform scroll that leaves a card half-visible.
- **The AI Insight Banner uses tertiary color for the icon only** — the banner background is tonal surface, not tertiary. Reserve tertiary for celebration/achievement moments.
- **Builder steps use a top step indicator** (M3E step connector pattern) so the user always knows where they are in the flow. Step indicator is compact — icon + number only, no long labels.
- **Bottom sheet for Library** during exercise selection: max height 75% of screen, drag handle visible, searchable, filtered by muscle group chips at the top of the sheet.

---

## Emotional Target for the Plan Tab

| Should feel like | Should NOT feel like |
|---|---|
| A personal trainer's notebook | A chatbot interface |
| A program design tool | A fitness content feed |
| A training studio | An AI product demo |
| Purposeful and expert | Busy and feature-heavy |

The AI's intelligence should be *felt* through the quality of suggestions — not *seen* through branding, capability lists, or chat UI prominence.

---

## Heuristic Validation Test (Plan Tab Specific)

A user who has never used the app opens the Plan tab. Can they:

1. Understand whether they have an active program within 2 seconds?
2. Find a way to start building a program within 3 seconds (CTA or template)?
3. Understand roughly what each quick-start template is for without reading more than 10 words?
4. Know that the AI is helping them, without the AI being the first thing they see?

If any answer is no → simplify.

---

## MAUI Implementation Notes (Plan Tab Specific)

- **Builder as a `NavigationPage` flow, not Shell routes.** The multi-step builder should use a local `NavigationPage` stack pushed over the Shell — this gives step-back behavior without polluting the global Shell route history. Pop back to `//plan` on completion or cancellation.
- **Quick-start `CollectionView`** with `ItemsLayout = LinearItemsLayout(ItemsLayoutOrientation.Horizontal)`, `SnapPointsType = MandatorySingle`, `SnapPointsAlignment = Start`. Fixed item width of `200dp` with `12dp` spacing.
- **AI Insight Banner** content is loaded async on `OnAppearing` via a `LoadInsightCommand` — show a subtle shimmer placeholder (not a spinner) while loading. If the API is unreachable (offline), hide the banner entirely — do not show an error state.
- **Goals chips** navigate via `Shell.Current.GoToAsync("//plan/goals")` — not a modal push. The Goals screen is a full page in the Plan section, not a sheet.
- **Builder `ProgramValidator`** runs client-side using the same rules as the server-side validator (section 6.5 of main spec) — advisory feedback in the builder does not require a network round trip.
- **`ProgramBuilderViewModel`** is a single ViewModel that owns all builder steps as observable state. Do not create separate ViewModels per step — the step is a `CurrentStep` integer property that drives which portion of the XAML is visible. This avoids complex inter-ViewModel data passing.

---

*RepWizard Plan Tab Redesign Specification — v1.0 — 2026*
