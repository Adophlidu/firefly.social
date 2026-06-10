---
name: ff-spec
description: >
  Product/PM role for the /ff-task pipeline. Takes a Firefly Jira URL / `FW-XXXX` key or a free-text
  requirement (plus an optional Figma/UI link), fetches and classifies it, and produces a structured
  spec: requirement summary, acceptance criteria, ordered task breakdown, design reference, and open
  questions. Writes `spec.md` + `checklist.md` to `.ff-task/<key-or-slug>/` as the
  handoff contract for `ff-testgen` and the implementation. Use when `/ff-task` calls it, or when the
  user asks to "拆需求" / "write the spec" / "break this down" for a Jira issue or requirement.
---

# ff-spec — Requirement → spec (the product role)

This is the **product/PM step** of the `/ff-task` pipeline. Its only job is to turn a raw ask into a
crisp, testable **spec** — it does **not** write tests and does **not** write implementation code.
Those are separate roles (`ff-testgen`, then implementation), and keeping this step separate is what
lets a later test author work from the *intended behaviour* rather than from whatever the code does.

```
Jira URL/key OR free-text requirement (+ optional Figma)
  → fetch + classify (Bug vs Feature)
  → spec.md   (requirement, acceptance criteria, task breakdown, design ref, open questions)
  → checklist.md   (the acceptance checklist the whole pipeline must satisfy)
```

## Output contract (where the artefacts go)

Resolve a stable key for the work:
- Jira mode → the `FW-NNNN` key.
- Requirement mode → a short kebab slug of the ask (e.g. `copy-link-post-menu`).

Write three files under **`.ff-task/<key>/`** (`mkdir -p` first — `.ff-task/` is git-ignored; it lives
at the repo root rather than inside `node_modules` so `pnpm clean` / reinstalls can't destroy the
approval record mid-pipeline):

- `spec.md` — the full spec (template below).
- `checklist.md` — just the acceptance/UI checklist as `- [ ]` items, so downstream steps can read it standalone.
- `coverage.md` — the traceability seed: one row per acceptance criterion ID, with the test column
  left empty for `ff-testgen` to fill and a verification column for the Phase 6 walk (template in Step 5).

**Every acceptance criterion gets a stable ID** (`AC-1`, `AC-2`, …). These IDs are the spine of the
whole pipeline — the checklist, the tests, the verification, and the coverage gate all key off them.

Return (as your final message) a short summary: the key, Bug/Feature, the file paths written, the
**top assumptions/risks**, and any open questions that need the user before implementation.

## Step 1 — Intake & fetch

Parse the first argument with `FW-\d+`:

- **Match → Jira mode.** Fetch via Atlassian MCP — `ToolSearch(query="+atlassian jira")` →
  `getAccessibleAtlassianResources()` (resolve the `mask` cloudId) → `getJiraIssue({ cloudId, issueIdOrKey })`.
  Pull `issuetype.name`, `summary`, `description` (flatten ADF), `status`, `priority`, `labels`,
  `assignee`, attachments, and **comments** (context often lives there). If Atlassian MCP is
  unavailable, fall back exactly as `resolve-jira-issue` Step 1c — ask the user to paste the issue
  text; don't loop.
- **No match → Requirement mode.** Treat the whole argument as a free-text requirement; derive the slug key.

## Step 2 — Classify Bug vs Feature

Use `resolve-jira-issue` Step 2 rules (primary signal `issuetype.name`; secondary signals from
wording). In Requirement mode, infer from the wording. Ask **one** clarifying question only if
genuinely ambiguous — otherwise proceed.

## Step 3 — Resolve the UI/Figma reference

Use the explicit second-arg Figma URL if given; else scan the Jira description/comments for
`figma.com` URLs; else, if the work is UI-shaped, ask once (don't loop). Pull context with
`mcp__plugin_figma_figma__get_metadata` → `get_design_context` → `get_screenshot`
(parse `figma.com/design/:fileKey/...?node-id=:nodeId`, converting `-` to `:` in the nodeId). Record
the design reference in the spec; the visual-delta items go into the checklist.

## Step 4 — Write the spec

Ground every file path in **real codebase exploration** — use an `Explore` agent for unfamiliar
areas; don't speculate. Then write `spec.md` using the matching template.

**Feature template:**

```markdown
# Spec — <FW-NNNN | slug>: <title>

## Assumptions & risks  ← surfaced first so the human reviews what matters
- Assumption: <something you inferred that, if wrong, changes the work>
- Risk: <blast radius / regression / unknown>

## Requirement summary
<one paragraph, plain language — quote the Jira/requirement accurately, don't twist it>

## Acceptance criteria
- [ ] **AC-1** — <observable, testable behaviour>
- [ ] **AC-2** — <…>
<!-- include the edge/error/empty/loading paths surfaced by the completeness pass as their own AC-N rows -->

## Design reference
- Figma: <URL or "none">
- Visual checks (fold into checklist): color / spacing / font / copy items if UI-shaped

## Affected surface
- Primary: apps/web | apps/wallet | packages/<name> — <one-line why>
- Likely entry points: `path/to/file.tsx`, `path/to/other.ts`

## Task breakdown (ordered)
1. <sub-task — file(s) touched>
2. <sub-task>

## Open questions
- <ambiguities needing the user, or "none">
```

**Bug template:**

```markdown
# Spec — <FW-NNNN | slug>: <title>

## Symptom
<what's broken, quoting the reporter>

## Reproduction steps
1. ... → observed: ... | expected: ...

## Expected behaviour (the contract)
- [ ] **AC-1** — <the correct behaviour the fix must produce — what SHOULD happen, independent of the
  current buggy code. This is what the regression test asserts.>
- [ ] **AC-2** — <related path / edge case the fix must also satisfy, if any>

## Affected surface
- Surface + likely entry points: `path/to/file.tsx:LINE`

## Hypothesised root cause
<short, grounded in reading the code — not speculation>

## Task breakdown (ordered)
1. <sub-task>

## Open questions
- <or "none">
```

## Step 4.5 — Completeness pass (don't skip — this is where requirements hide)

Before finalising the criteria, force yourself through this checklist and **add an `AC-N` row for every
path that applies** (don't just mention them in prose — if it isn't an AC, nothing downstream covers it):

- **Edge / boundary**: empty input, max/min, very long, zero/one/many, duplicates, unicode.
- **Error paths**: network failure, rejected wallet signature, unauthorized, not-found, timeout.
- **States**: loading, empty-state, error-state, success — for any new UI.
- **i18n**: every user-visible string wrapped; pluralisation if counts are shown.
- **Mobile / responsive**: the mobile-shaped layout if the surface has one.
- **a11y**: focus/keyboard/labels for interactive elements.
- **Non-functional**: perf-sensitive paths, large lists, anything that runs on every render.

Anything genuinely out of scope → write it under "Open questions" or an explicit "Out of scope" note,
so the omission is a *decision*, not a silent gap.

### Definition of Done (the spec is ready when…)
- [ ] Every criterion is observable and testable (a machine or a walkthrough can decide pass/fail).
- [ ] Each criterion has a stable `AC-N` ID.
- [ ] The completeness pass above was actually run; edge/error/state paths are AC rows or explicitly out of scope.
- [ ] Assumptions & risks are stated; open questions are listed (or "none").

## Step 5 — Write the checklist + coverage matrix

Write `checklist.md` — the acceptance criteria as `- [ ] **AC-N** — …` items (carry the IDs), plus
per-criterion visual-delta items when there's a Figma reference (color / spacing / font-size / icon /
copy). This is the gate the whole pipeline must satisfy.

Write `coverage.md` — the traceability matrix, one row per `AC-N`, test column empty for `ff-testgen`:

```markdown
# Coverage — <key>
| AC | Criterion | Test(s) | Verification step |
| --- | --- | --- | --- |
| AC-1 | <short> | _(ff-testgen fills)_ | <how Phase 6 confirms it in the browser> |
| AC-2 | <short> | _(ff-testgen fills)_ | <…> |
```

A criterion that is purely visual (no automatable assertion) still gets a row — mark its Test column
`visual-only` so the gate knows it's covered by the Phase 6 Figma walk, not a unit/e2e test.

## Hard rules

- **Quote requirements accurately** — don't paraphrase until they say something convenient.
- **Spec only.** No test files, no implementation. Stop after writing `spec.md` + `checklist.md` + `coverage.md`.
- **Acceptance criteria must be observable/testable** — each one is something `ff-testgen` can assert.
- **Every criterion has an `AC-N` ID and a `coverage.md` row** — no un-IDed, un-tracked criteria.
- **English** in the written artefacts (memory: `feedback_docs_language`); chat in the user's language.
- Convert relative dates ("today") to absolute when summarising.

## Related skills

- `resolve-jira-issue` — source of the Jira fetch / classification / Figma mechanics reused here.
- `ff-testgen` — the next role; consumes `spec.md` + `checklist.md` + `coverage.md` (fills the test column).
- `/ff-task` — the orchestrator that calls this skill.
- `superpowers:brainstorming` — for genuinely open-ended features before the spec firms up.
