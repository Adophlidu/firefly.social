---
name: ff-task
description: >
  Orchestrator for the Firefly task pipeline (the "Tech Lead"). Takes a Jira URL / `FW-XXXX` key or a
  free-text requirement (plus an optional Figma/UI link) and runs the full lifecycle by delegating to
  role skills: `ff-spec` writes the spec + checklist, `ff-testgen` (an isolated subagent, blind to the
  implementation) writes the tests, then this skill gates on user approval, implements, runs all tests
  with a bounded 2-round self-fix loop, verifies the checklist in the user's Chrome, and runs a Codex
  review before declaring success. Use when the user types `/ff-task`, or asks to "run the full
  pipeline" / "跑完整流程" on a Jira issue or requirement.
---

# /ff-task — pipeline orchestrator (Tech Lead)

`/ff-task` does not do the work itself — it **conducts the team**. Each role is its own skill, so each
can be improved and run independently, and the test author can stay *independent* of the implementer.

```
ff-spec      (product role, inline)     →  spec.md + checklist.md + coverage.md (AC-N IDs)
branch + baseline                       →  feature branch FIRST; record pre-existing failures
ff-testgen   (QA role, SUBAGENT, blind) →  unit + e2e test files (RED) + fills coverage matrix
🛑 COVERAGE GATE + USER APPROVAL         →  every AC mapped; risks-first review
[implement]  (eng role, inline)         →  code to green on the branch (assertions frozen)
test loop    (max 2 rounds, root-cause) →  typecheck/lint/unit/e2e; only NEW failures count
verify       (in YOUR Chrome via CDP)   →  walk the checklist, Figma deltas
review gate  (codex + weakest-part lens)→  adversarial, not single-pass
→ report (reviewed PR — human+CI still final) + suggest /create-pr
```

**Why two of the roles are split out, and why one is a subagent:** modularity (a reusable, separately
maintainable `ff-spec` / `ff-testgen`) plus *independence* — `ff-testgen` runs in an isolated subagent
that has not seen the implementation, so its tests assert the **intended** behaviour from the spec
rather than mirroring whatever the code does. That independence is the quality win; a plain inline
skill call would not give it.

## Argument shapes

| Invocation | Behaviour |
| --- | --- |
| `/ff-task https://mask.atlassian.net/browse/FW-7406` | Jira mode — full pipeline. |
| `/ff-task FW-7406` | Bare key, site defaults to `mask.atlassian.net`. |
| `/ff-task FW-7406 https://figma.com/design/...` | Jira issue + explicit Figma reference. |
| `/ff-task "Add a copy-link button to the post menu"` | Free-text requirement, no Jira fetch. |

A second positional arg that is a `figma.com` URL is always the UI reference. Resolve a stable **key**
up front: the `FW-NNNN` for Jira mode, or a short kebab slug for requirement mode. All handoff
artefacts live under `.ff-task/<key>/` (git-ignored, at the repo root — deliberately NOT inside
`node_modules`, so `pnpm clean` / reinstalls can't destroy the approval record mid-pipeline).

## Resume (when `.ff-task/<key>/` already exists)

A re-invocation with the same key is a **resume**, not a restart. Read what exists (`spec.md`?
tests in `coverage.md`'s Test column? feature branch? implementation commits?) to infer the phase,
tell the user what you found, and continue from there — don't regenerate artefacts that were already
approved. One caveat: once implementation code exists, re-dispatching `ff-testgen` is **no longer
blind**. Prefer keeping the existing tests; regenerate only if the user explicitly accepts that the
independence guarantee is gone for the regenerated files.

## Hard rules (non-negotiable)

- **Approval gate before any code.** Present spec + checklist + the generated tests, then STOP and
  wait. Never write implementation code in the same turn as the gate.
- **Tests come from the spec, before the code, by an independent author.** `ff-testgen` runs as a
  subagent that does not read the implementation. Don't shortcut it into an inline step.
- **Stop after 2 failed fix rounds.** If tests still fail after 2 self-fix rounds, halt and hand the
  failing output back to the user. Do **not** advance to verification, Codex, or a success claim.
- **Codex gate before success.** No "done" until the reviewer (Codex, or `/code-review-pr` fallback)
  comes back clean.
- **English** in committed artefacts (memory: `feedback_docs_language`); chat in the user's language.
- **Carry `FW-NNNN`** into the branch + PR title in Jira mode (Firefly CI enforces it). No AI
  attribution lines in commits.

---

## Phase 1 — Spec (delegate to `ff-spec`, inline)

Invoke the **`ff-spec`** skill with the user's arguments. It fetches/classifies the Jira issue or
requirement, resolves the Figma reference, and writes `spec.md` + `checklist.md` + the `coverage.md`
seed to `.ff-task/<key>/`. Run it **inline** (same context) — it may need to ask the user a
clarifying question, and its output feeds the gate.

If `ff-spec` returns open questions that block the work, surface them to the user and wait — don't
proceed to tests on an ambiguous spec.

**Then, before dispatching `ff-testgen`, set up the workspace:**

1. **Create the feature branch now** (`/commit` conventions: `feat/<slug>` / `fix/<slug>`, carrying
   `FW-NNNN` in Jira mode). `ff-testgen` writes files into the real test dirs — they must land on the
   branch, never sit uncommitted on `main` while the gate waits.
2. **Record the baseline.** Run the Phase 5 typecheck/lint/unit commands once (scoped to the affected
   package) and save any failing output to `.ff-task/<key>/baseline.md` (or write "clean"). Nothing of
   ours exists yet, so every failure recorded here is **pre-existing and out of scope** — Phase 5 counts
   only failures NOT in this baseline against the fix rounds.

## Phase 2 — Tests (delegate to `ff-testgen`, as a SUBAGENT)

Dispatch `ff-testgen` via the **Agent tool** (a fresh subagent), not an inline skill call — isolation
is the point. Prompt it roughly:

> Invoke the `ff-testgen` skill and follow it exactly. Inputs:
> `.ff-task/<key>/spec.md`, `…/checklist.md`, and `…/coverage.md`.
> Write the unit (vitest) and e2e (Playwright) tests into the real test dirs and **fill the Test column
> of `coverage.md` for every `AC-N`**. **You have not seen and must not read the implementation** —
> assert the intended behaviour from the spec only. Return the files written, the per-AC coverage line,
> and any criteria you couldn't make deterministic.

The implementation does not exist yet at this point, so blindness is natural; the rule still matters
for bug fixes (assert the spec's *expected* behaviour, not the current buggy behaviour). Relay any
"blocked / ambiguous" items from the subagent to the user before the gate.

## Phase 3 — Approval gate (hard stop)

**First, the coverage gate (mechanical).** Read `coverage.md`. **Every `AC-N` row must have a non-empty
Test cell** — a test file, `visual-only`, or `BLOCKED`. If any cell is empty, or any row is `BLOCKED`,
the spec/tests aren't ready: surface the gap and loop back (re-run `ff-spec` / re-dispatch `ff-testgen`)
before involving the user. Don't present a gate with silent holes.

Then post, in one message, **with the risky bits first**:
1. **Assumptions & risks + open questions** (from `spec.md`) — top of the message, so the human reviews
   what actually matters instead of rubber-stamping.
2. The `checklist.md` items and the `coverage.md` matrix (AC → test → verification) — proof every criterion is covered.
3. The test files `ff-testgen` wrote (paths + what each asserts).

Then **stop and wait.**

> A local Stop hook may run `pnpm typecheck` at this stop and report unresolved imports in the new RED
> tests. That **is** the expected RED state (the implementation doesn't exist yet) — acknowledge it and
> keep waiting; don't "fix" anything before approval.

- "Looks good" / "Go" / "Approved" → Phase 4.
- Edits → revise the spec (re-run `ff-spec`), regenerate affected tests (re-dispatch `ff-testgen`), re-run the coverage gate, re-post, wait.
- "Hold on…" → wait. Don't ping, don't proceed.

Never present the gate and start coding in the same turn.

## Phase 4 — Implement (eng role, inline)

After approval:

1. **Confirm you're on the feature branch created in Phase 1** (create it now only if it's somehow
   missing — that's a process slip worth noting).
2. **Work the spec's task breakdown** sub-task by sub-task; mirror it into the TODO list
   (`TaskCreate`) and update as you go. Follow `/architecture`, `/i18n`, `code-quality`, and
   `implementing-figma-designs` (UI-first → i18n → data; Tamagui only in the external
   `@dimensiondev/rn-ui` package — never in this repo). Lean on `resolve-jira-issue` for the detailed
   Bug/Feature implementation mechanics.
3. The goal is to make the `ff-testgen` tests pass. **Assertions are frozen** — never weaken or delete
   an `expect()` to go green. But the **interface is negotiable**: if the blind test guessed the wrong
   import path / symbol name / invocation shape, you may reconcile that wiring to the real API you built.
   Guard rail: after any test edit, diff it and confirm **only interface/import lines changed and every
   `// ASSERTION (frozen)` line is byte-for-byte identical**. If the *assertion itself* looks wrong,
   that's a spec disagreement — pause, reconcile the spec with the user, and regenerate via `ff-testgen`;
   don't quietly rewrite it.
4. If a hard architectural decision surfaces that wasn't in the spec, pause and revise the spec first.
   Use `group-think` for genuinely contested calls.

## Phase 5 — Test-run / self-fix loop (bounded)

Run, in order, scoped with `--filter=<affected-package>` for speed:

```bash
pnpm typecheck --filter=<pkg>
pnpm lint --filter=<pkg>
pnpm test --filter=<pkg>                      # vitest unit tests (full package suite — catches regressions)
npx playwright test e2e/<new-spec-files>      # ONLY the e2e files this pipeline wrote — full-suite e2e is CI's job, and unrelated flakes must not pollute the fix loop
```

- **Baseline filter first.** Diff every failure against `.ff-task/<key>/baseline.md`: failures already
  in the baseline are **pre-existing** — do NOT spend fix rounds on them and do NOT "fix" unrelated
  code to clear them; carry them as a named caveat into the Phase 7 report. Only NEW failures count.
- **All green (modulo baseline) → Phase 6.**
- **Round 1 — fix and re-run.** Diagnose, fix the *implementation* (not the assertions), re-run.
- **Round 2 — root-cause first.** Before touching code a second time, write one or two sentences naming
  the **root cause** of the remaining failure. If you can't name it, or it's the same failure you "fixed"
  in round 1 (symptom-patching), **invoke `superpowers:systematic-debugging`** instead of guessing again
  — don't retry the same approach with tweaks (per `CLAUDE.md`). Then fix and re-run.
- **Cap: 2 fix rounds.** If anything still fails after round 2, **STOP.** Post the failing command +
  output, the root-cause note, and what each round tried, and hand back to the user. Do **not** continue
  to Phase 6/7 and do **not** claim success.
- **Never go green by weakening a test.** A green achieved by editing an assertion is a failure, not a pass.

E2E needs Chrome on CDP `localhost:9222` + a logged-in/wallet-connected session (see
`resolve-jira-issue` Step 7b.0). If CDP is unreachable, tell the user the exact launch command; don't
auto-spawn Chrome.

## Phase 6 — Checklist verification (in the user's Chrome)

Walk each `checklist.md` item interactively (use `coverage.md`'s Verification column as the per-`AC-N`
script — every AC, including `visual-only` ones, gets walked here), reusing `resolve-jira-issue` Step 7:

- Boot the dev server in the background (`apps/web` :3000 / `apps/wallet` :3001); poll until it answers.
- **Always open a new tab via `browser_tabs`**; never reuse the user's tab; **never `browser_close`**
  (it tears down the user's whole Chrome under CDP).
- Walk each criterion; screenshot before/after to `.ff-task/<key>/verification/`.
- **Pause on every wallet popup** with the 🛑 pattern — never auto-click MetaMask; never send mainnet
  txs with real funds.
- For Figma-backed criteria, pull `get_screenshot` and list concrete visual deltas (or "no notable diffs").
- Read `browser_console_messages` — no new errors. Kill the dev server; close only the tabs we opened.

Every checklist item must pass. If any fails, go back to Phase 4/5 — don't paper over it.

## Phase 7 — Review gate (adversarial, not single-pass)

A single pass/fail is a weak quality gate. Run two complementary lenses on the **working-tree diff**:

1. **Correctness review.** Run Codex review via the global `/codex` skill if available; otherwise fall
   back to the repo's **`/code-review-pr`** skill. If you fall back, **say so explicitly** in the report
   — the user should know Codex didn't run.
2. **"Weakest part" lens.** Independently ask: *what is the single weakest part of this diff, and how
   would it break?* — error handling, an untested edge, a risky assumption, a perf cliff, a layer/i18n
   violation lint wouldn't catch. (Codex "challenge" mode is ideal here; otherwise do this as a focused
   self-review against `/architecture` + `vercel-react-best-practices`.) Turn each finding into either a
   fix or an explicit, surfaced risk — don't let it pass silently.
3. **Blocking findings → fix and re-review.** Fixes re-enter Phase 5 (the test loop runs again, including
   any new test the review motivated).
4. **Both lenses clean → success.** Report and suggest **`/create-pr`** (pass `FW-NNNN` so the PR title
   satisfies CI). Be honest about scope in the report: this delivers a *reviewed, test-backed PR* — human
   review + CI are still the final gate. This skill is read-only on Jira; update the issue only if asked.

```markdown
## /ff-task complete — <FW-NNNN | slug>
- Spec/tests: .ff-task/<key>/ (spec.md, checklist.md, coverage.md)
- Branch: <feat/…>
- Tests: typecheck ✅ lint ✅ unit ✅ e2e ✅ (or "skipped — no e2e infra")
- Baseline: clean | <N> pre-existing failures (out of scope — see .ff-task/<key>/baseline.md)
- Coverage: N/N acceptance criteria mapped to tests (+ M visual-only via the Figma walk)
- Checklist: N/N verified (screenshots in .ff-task/<key>/verification/)
- Review: Codex ✅ (or "/code-review-pr ✅ — Codex unavailable") + weakest-part lens ✅
- Caveat: e2e is CDP-only (not CI-reproducible); human review + CI still required.
- Next: /create-pr
```

---

## Anti-patterns

- ❌ **Running `ff-testgen` inline instead of as a subagent.** Kills the independence the split exists for.
- ❌ **Weakening or deleting an assertion to go green.** Assertions are frozen; only interface/imports are negotiable.
- ❌ **Presenting the gate with an incomplete `coverage.md`.** Every `AC-N` must map to a test / visual-only / BLOCKED first.
- ❌ **Rubber-stamp gate.** Lead with assumptions/risks/open-questions, not a wall of green checks.
- ❌ **Symptom-patching in the fix loop.** Round 2 needs a named root cause; same failure twice → `systematic-debugging`.
- ❌ **Burning fix rounds on baseline failures** — pre-existing failures are out of scope; never "fix" unrelated code to clear them.
- ❌ **Dispatching `ff-testgen` before the feature branch exists** — its files would sit uncommitted on `main`.
- ❌ **Coding before the approval gate**, or writing code before the tests exist.
- ❌ **Pushing past a failing 2-round test loop.** Stop and hand back — never fake a green pipeline.
- ❌ **Reporting "done" as if guaranteed.** It's a reviewed, test-backed PR — human review + CI are still the final gate.
- ❌ **Claiming "done" without the Codex / `code-review-pr` gate passing.**
- ❌ **Scaffolding Playwright e2e infra inline.** If `e2e/` is missing, `ff-testgen` skips e2e and says so.
- ❌ **`browser_close` under CDP**, navigating the user's tab, or auto-clicking wallet popups.
- ❌ **Mainnet transactions with real funds during verification.** Testnet / throwaway wallet only.
- ❌ **Tamagui in apps/web or apps/wallet.** Only in the external `@dimensiondev/rn-ui` package.
- ❌ **Branch / PR title without `FW-NNNN`** in Jira mode, or AI attribution lines in commits.

## The team (related skills)

- `ff-spec` — product role: requirement → spec + checklist + coverage matrix (with a completeness pass + DoD).
- `ff-testgen` — QA role (subagent): spec → unit + e2e tests (blind), fills the coverage matrix, assertions frozen.
- `resolve-jira-issue` — the detailed eng mechanics (Jira/Figma/CDP) Phase 4–6 lean on.
- `implementing-figma-designs`, `/architecture`, `/i18n`, `code-quality` — implementation rules.
- `/codex` (global) → `code-review-pr` (local fallback) — the Phase 7 review gate.
- `create-pr` — opens the PR with `FW-NNNN` once green.
- `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents` — the patterns behind the subagent split.
- `superpowers:systematic-debugging` — when the self-fix loop hits a non-obvious failure.
