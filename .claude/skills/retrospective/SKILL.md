---
name: retrospective
description: >
    Analyze accumulated bug-fix cases and propose updates to Firefly's rule docs
    (CLAUDE.md and the .claude/commands/* references). Use periodically
    (weekly/monthly) to evolve quality checks based on real issues.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Retrospective: Evolve Firefly's Rules from Real Cases

## Workflow

### Step 1: Read Cases

Read `.claude/skills/retrospective/references/case-studies.md`. Count cases since the last `<!-- Retrospective completed -->` marker. If fewer than 3 new cases, report "Not enough new cases" and stop.

### Step 2: Analyze Patterns

For each case, extract the root-cause category and identify which existing rule could have caught it:

| Rule source         | Where it lives                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| Restricted patterns | `CLAUDE.md` (no `clsx`, no relative imports, ESM shims, classNames, etc.) |
| Layer hierarchy     | `.claude/commands/architecture.md`                                        |
| i18n usage          | `.claude/commands/i18n.md`                                                |
| rn-ui import rules  | `.claude/commands/rn-ui.md`                                               |
| Commit conventions  | `.claude/commands/commit.md`                                              |

Tag each case as either:

- The number/name of the existing rule that could have caught it, or
- `NEW` if no existing rule covers it.

Aggregate counts per pattern.

### Step 3: Identify Gaps and Weak Spots

- **Gaps**: patterns appearing **2+ times** tagged `NEW` → candidates for new rule items
- **Weak spots**: patterns appearing **3+ times** already covered → existing rule needs stronger wording or more specificity

### Step 4: Propose Changes

Output a short report:

```
Retrospective — YYYY-MM-DD
Cases analyzed: N (date range: YYYY-MM-DD to YYYY-MM-DD)
Recurring patterns: [pattern] N (NEW/WEAK), [pattern] N (NEW/WEAK)
Proposed changes:
  - Add to [file]: [one-line check]
  - Strengthen [file] section: [current → revised]
Housekeeping: archive candidates [list], zero-hit checks [list]
```

### Step 5: Apply Changes (after user confirmation)

Rules when modifying `CLAUDE.md`:

1. **Max ~100 lines** — `CLAUDE.md` is loaded into every session's context. If exceeded, consolidate similar items or move long-form details to the relevant `.claude/commands/*.md`.
2. **One-liner check items only** in `CLAUDE.md` — no code examples in the top-level file.
3. **Keep existing section order** (Repository Overview → Verification → Architecture → Restricted Patterns → Git → Debugging → Skills Reference).
4. **Long-form rationale and code examples** go into `.claude/commands/architecture.md`, `i18n.md`, `rn-ui.md`, or `commit.md`.
5. **Never delete case entries** from `references/case-studies.md` — mark archived with `[ARCHIVED]` prefix.

### Step 6: Update Timestamp

Append to `references/case-studies.md`:

```
<!-- Retrospective completed: YYYY-MM-DD | Cases analyzed: N | Changes applied: N -->
```

## Example

5 cases collected:

- 3 layer violations (store imports a hook, hook imports a component, service imports a hook)
- 1 missing `'use client'` directive
- 1 `clsx` used instead of `classNames`

Analysis:

- Layer violations = WEAK (3 hits, already covered in `architecture.md`) → consider strengthening the wording or adding a CI grep.
- `'use client'` placement = NEW (1 hit) → not enough to act on, defer.
- `clsx` = NEW (1 hit) → already in CLAUDE.md restricted patterns; was the offender unaware? Strengthen wording.

Proposal: tighten the "Common Violations & Fixes" examples in `architecture.md` to add a one-line grep recipe contributors can run before committing.
