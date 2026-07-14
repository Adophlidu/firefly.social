---
name: group-think
description: Spawns three `general-purpose` agents with distinct analytical perspectives (conservative root cause, best-practice, creative) to collaboratively analyze a hard problem, then presents a comparison table for the user to choose from. Use when facing tricky bugs, design decisions, architecture choices, or any task that benefits from multiple viewpoints. Triggers on "group think", "multi-agent", "team analysis", "3 agents", "collaborative analysis", "debate solutions".
---

# Multi-Agent Collaborative Analysis

Spawn 3 AI analysts with distinct perspectives to analyze a problem in parallel, then synthesize their findings into a comparison table for the user.

## Two Execution Modes

This skill supports two modes, depending on what the harness supports:

| Mode                                  | When                                                                         | How agents communicate                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **A. Parallel-spawn** (default)       | Always supported                                                             | Spawn 3 agents in parallel; the team lead synthesizes their independent reports |
| **B. Team-with-messaging** (optional) | Only if `TeamCreate` / `SendMessage` primitives are available in the harness | Agents talk to each other via `SendMessage`; team lead facilitates              |

Default to Mode A. Only attempt Mode B if you can confirm the harness exposes `TeamCreate` and inter-agent `SendMessage`. If unsure, use Mode A — it's strictly simpler and the result quality is comparable for most problems.

## Workflow

### Step 1: Clarify the Problem (MANDATORY — Do NOT skip)

Before ANY code exploration, use `AskUserQuestion` to fill in missing context. Ask up to 4 questions covering:

| Dimension        | Why it matters                                                                 | Example question                                                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**        | Narrow down what exactly is broken or needs design                             | "Which behavior is wrong — the animation, the data, or the layout?"                                                                                                                                                                                                             |
| **Surface**      | Different surfaces have different stacks; Tamagui only lives in the external `@dimensiondev/rn-ui` package | "Which surface is affected — apps/web (Next.js + Tailwind), apps/wallet (Vite + react-native-web + shadcn), the perps routes in apps/wallet (just mount rn-ui screens, no Tamagui at this layer), or a shared package?" |
| **Reproduction** | Without steps, agents will guess                                               | "What are the steps to reproduce? (or provide a screenshot / video link)"                                                                                                                                                                                                       |
| **Constraints**  | Business or tech constraints shape the solution                                | "Are there performance budgets, backward-compat requirements, or deadlines?"                                                                                                                                                                                                    |

**Rules:**

- Only ask questions whose answers you cannot infer from the user's message or the codebase.
- If the user's description is already detailed (surface, steps, expected vs actual), skip directly to Step 2.
- Frame questions as multiple-choice with `AskUserQuestion` when possible — faster for the user.
- Maximum 1 round of questions. Do NOT ask follow-ups; gather what you can and move on.

### Step 2: Deep Codebase Exploration (Team Lead)

Before spawning agents, you (the team lead) MUST thoroughly explore the codebase yourself. Agents are expensive — giving them a rich Context Brief upfront is far cheaper than three agents each fumbling through exploration independently.

Use the `Explore` Agent type:

```
Agent({
  subagent_type: "Explore",
  description: "Explore <topic> codebase",
  prompt: "Thoroughly investigate <problem description>.
    Find: entry points, call chains, state management, surface-specific code (apps/web vs apps/wallet),
    related tests, recent git changes, and any TODO/FIXME/HACK comments.
    Return: file paths, key code snippets, and a dependency map."
})
```

The exploration MUST produce a **Context Brief** covering:

1. **Entry Point** — where the user interaction starts (page, component, route).
2. **Call Chain** — full execution path (component → hook → service / provider → store → helpers, or the @dimensiondev/rn-ui equivalent).
3. **State Flow** — Zustand stores, jotai atoms, or context providers involved.
4. **Surface-Specific Variants** — `apps/web` vs `apps/wallet` differences; `#/esm/*` shims used.
5. **Key Code Snippets** — the actual code (not just file paths) for the critical sections (each snippet < 50 lines, with file path + line range as header).
6. **Recent Changes** — `git log --oneline -10` on the relevant files to spot recent regressions.
7. **Related Issues** — any TODO/FIXME/HACK comments or FW-XXX Jira refs in the code.
8. **Current Behavior vs Expected** — what the code does now vs what it should do.

This Context Brief will be embedded in every agent's prompt. The quality of agent analysis is directly proportional to the quality of this brief.

### Step 3: Spawn 3 Agents in Parallel (Mode A — default)

Spawn all 3 agents **simultaneously** in a single message with 3 `Agent` tool calls. Each agent gets the same Context Brief and a different analytical mandate:

| Agent                                   | Focus                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| **Analyst A — Conservative root cause** | Deep root-cause analysis, conservative minimal fix                                    |
| **Analyst B — Best practices**          | Industry / framework best practices (React 19, Next.js 16, Tamagui, Zustand patterns) |
| **Analyst C — Creative / alternatives** | Alternative approaches, edge cases others might miss                                  |

Each call:

```
Agent({
  subagent_type: "general-purpose",
  description: "<Analyst A/B/C> analysis of <topic>",
  prompt: "You are Analyst <A/B/C> on a 3-person analysis team for the Firefly Web3 social platform.

## Problem Statement
<1–2 sentence problem description from user, after clarification>

## User Constraints
- Affected surface(s): <from Step 1>
- Reproduction steps: <from Step 1>
- Constraints/deadlines: <from Step 1 or 'None specified'>

## Context Brief (from team lead's codebase exploration)
### Entry Point
<where user interaction starts>

### Call Chain
<component → hook → service / provider → store → helpers>

### State Flow
<Zustand stores, jotai atoms, context providers>

### Surface-Specific Variants
<apps/web vs apps/wallet differences, ESM shims>

### Key Code Snippets
<actual code, with file:line headers>

### Recent Git Changes
<git log --oneline -10 output>

### Related Issues & Tech Debt
<TODO/FIXME/HACK comments, FW-XXX refs>

### Current Behavior vs Expected
- Current: <what the code does now>
- Expected: <what it should do>

## Your Analytical Perspective
<conservative root cause / best practices / creative alternatives — be specific>

## Firefly-Specific Constraints
Any proposed fix MUST respect:
- Layer hierarchy (apps/web/src: components → hooks → services → store → helpers)
- @dimensiondev/* workspace layers (Layer 1 packages may not import sibling Layer 1)
- Restricted patterns: no clsx, no relative imports, ESM shims for next/*, classNames util, .js extensions on `#/` (or legacy `@/`) imports
- i18n via Lingui macros (@lingui/react/macro for JSX, @lingui/core/macro for JS)
- 'use client' as the first line of client components in app/
- memo() wrap on non-trivial components

## Instructions
1. Review the Context Brief carefully. You may read additional files if needed.
2. Analyze the problem from your unique perspective.
3. Propose a concrete solution with exact code changes (show old code → new code).
4. Produce a final report with:
   - Approach name (1 sentence)
   - Exact file paths and code changes
   - Pros and cons
   - Risk assessment (Low / Medium / High)
   - Trade-offs vs alternative approaches you can foresee

## Important
- You ONLY analyze and propose. Do NOT edit any files.
- Use Read, Grep, Glob to inspect the codebase. Do NOT use Write, Edit, or any other state-mutating tool.
- Return your full report in your final message."
})
```

All three calls go in a single message. Wait for all three to complete.

### Step 3 (alternate): Team-with-messaging (Mode B — only if supported)

If your harness supports `TeamCreate` and inter-agent `SendMessage`, you can instead spawn agents as team members so they can debate with each other. The flow:

1. `TeamCreate({ team_name: "analysis-<topic>", description: "..." })`
2. Spawn 3 agents with `team_name` + `name` parameters (NOT `run_in_background: true`).
3. Each agent sends its analysis to the other two via `SendMessage`.
4. Agents refine their final report based on peer input.
5. Team lead collects 3 final reports and proceeds to Step 4.

Most Claude Code installations do NOT expose `TeamCreate` or inter-agent `SendMessage` from the main thread. If you call `TeamCreate` and get an error / undefined tool, abort Mode B and use Mode A.

### Step 4: Synthesize and Present Comparison

After all 3 agents complete (Mode A) or send final reports (Mode B), build a comparison table:

```markdown
| Dimension         | Analyst A (Conservative)    | Analyst B (Best Practice) | Analyst C (Creative) |
| ----------------- | --------------------------- | ------------------------- | -------------------- |
| Approach          | ...                         | ...                       | ...                  |
| Complexity        | Low / Medium / High         | ...                       | ...                  |
| Risk              | Low / Medium / High         | ...                       | ...                  |
| Files changed     | ...                         | ...                       | ...                  |
| Layer-rule impact | clean / requires move / ... | ...                       | ...                  |
| Pros              | ...                         | ...                       | ...                  |
| Cons              | ...                         | ...                       | ...                  |
```

Then:

1. Add a one-paragraph recommendation with reasoning. State which approach you'd pick and why, but let the user override.
2. Ask: "Which approach would you like to implement?"

### Step 5: User Decides

The user picks an approach. Then either:

- The main thread implements the chosen approach directly, **OR**
- The main thread invokes a domain-specific skill to implement it (`resolve-jira-issue` for Jira-backed work, `/ff-task` for the full spec→test→implement pipeline).

## Important Rules

- Agents ONLY analyze and propose. They do NOT implement code changes — the main thread does, after user confirmation.
- Always present the user with all 3 proposals before implementing anything.
- The user makes the final decision on which approach to use.
- Keep agents focused: each prompt should include the specific files to read and the Firefly-specific constraints (layer rules, restricted patterns).
- Don't ask the user to choose mode A vs B — pick automatically based on harness capabilities. Mode A is the default.

## Example Invocation

User: "Use multi-agent analysis to figure out why the compose modal sometimes opens with stale draft content."

Response flow:

1. `AskUserQuestion` → "Which surface? Which trigger path? Does it happen on every open or only after specific actions?"
2. `Agent({ subagent_type: "Explore", ... })` → deep-dive into `ComposeModal`, draft store, and modal lifecycle. Produce Context Brief.
3. Three parallel `Agent` calls in one message — Analyst A, B, C — each with the full Context Brief and the Firefly-specific constraints block.
4. Collect 3 final reports.
5. Build comparison table; recommend; ask user to pick.
6. Implement the chosen approach (or delegate to `resolve-jira-issue` / `/ff-task`).
