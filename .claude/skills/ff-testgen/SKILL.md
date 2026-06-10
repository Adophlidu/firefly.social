---
name: ff-testgen
description: >
  QA role for the /ff-task pipeline. Given a spec (`spec.md` + `checklist.md` from `ff-spec`), writes
  the unit (vitest) and e2e (Playwright) test cases that encode the acceptance criteria — BEFORE any
  implementation exists, and deliberately blind to the implementation's logic, so the tests assert the
  intended behaviour rather than mirroring the code. Designed to run as an isolated subagent. Use when
  `/ff-task` dispatches it, or when the user asks to "write the tests" / "生成测试用例" from a spec.
---

# ff-testgen — Spec → tests (the QA role)

This is the **test-author step** of the `/ff-task` pipeline. You take a finished spec and turn each
acceptance criterion into executable tests. You write tests **only** — never implementation code.

**Why this runs as an isolated subagent:** an independent test author who has *not* read the
implementation writes tests that assert what the feature *should* do, not what the code *happens* to
do. That independence is the whole value — it catches "tests that just echo the implementation" and,
for bug fixes, stops you from encoding the current (buggy) behaviour as "correct."

```
spec.md + checklist.md  (the contract)
  → unit tests (vitest)      → apps/web/tests/… or apps/wallet/test/…
  → e2e tests (Playwright)   → e2e/…  (CDP-attached)
  → tests expected RED (feature not built / bug not fixed yet)
```

## Inputs

- `.ff-task/<key>/spec.md` — requirement, acceptance criteria (`AC-N` IDs), surface, design ref.
- `.ff-task/<key>/checklist.md` — the acceptance/UI checklist.
- `.ff-task/<key>/coverage.md` — the traceability matrix. **You fill the Test column.**

Read all three first. Work **AC-by-AC**: every `AC-N` must end up with either a test file in its
`coverage.md` row, or the literal `visual-only` marker (covered by the Phase 6 Figma walk). If a
criterion is too vague to write a deterministic assertion for, do **not** guess — leave its Test cell
`BLOCKED` and record it under "Blocked / ambiguous" in your return summary so the orchestrator takes it
back to the user. **Do not leave any AC row's Test cell empty** — empty means "silently dropped," which
the orchestrator's coverage gate will reject.

## The independence rule (read this twice)

- **Derive expected behaviour from the spec**, never from the implementation's current logic.
- You **may** inspect *public API surface* to make tests compile and idiomatic: exported function/
  component signatures, prop types, existing test helpers/fixtures, and the repo's testing patterns.
- You **must not** read an implementation's internals to decide *what the correct result is*. For bug
  fixes especially: assert the **expected** behaviour from `spec.md`, not what the buggy code returns today.
- If the target symbol doesn't exist yet (feature not built), that's expected — import it as the spec
  describes; the test will fail to resolve/compile until implementation lands. That RED state is correct.

### The assertion is frozen; the interface is negotiable
You're guessing the API shape (function name, import path, prop names) before it's built, so it may not
match what the implementer ultimately chooses. That's fine and expected. Make the boundary explicit:
- The **assertion** — the expected value/state/behaviour for each `AC-N` — is the **contract. It is frozen.**
  The implementer may NOT change it to make a test pass.
- The **interface** — import path, symbol name, how the subject is invoked/rendered — is **negotiable.**
  The implementer may reconcile it to the real API later (and the orchestrator re-confirms the assertions
  didn't change). So write assertions you're confident about, and keep the wiring around them thin and
  obvious, so an interface tweak never forces touching an assertion. Add a `// ASSERTION (frozen)` comment
  on the key expect() lines so the boundary is visible in the diff.

## Step 1 — Unit tests (vitest)

Follow the existing layout and conventions (read a couple of neighbouring tests first):
- apps/web → `apps/web/tests/<area>/<name>.test.ts(x)`
- apps/wallet → `apps/wallet/test/<area>/<name>.test.tsx`

These files **are linted and typechecked**, so obey repo rules: `@/…` imports with `.js` extension,
**no relative `../` imports**, `classNames` (web) / `cn` (wallet) for class strings, ESM shims for
`next/*`. One `describe` per unit; one `it` per acceptance criterion or branch (happy path + the
negative/edge paths the spec calls out). Make assertions specific — assert values/states, not just "truthy."

## Step 2 — E2E tests (Playwright)

Only if the e2e suite exists (`playwright.config.ts` + `e2e/`). One `*.spec.ts` per acceptance
criterion that has a user-visible flow:

```ts
import { expect, test } from './fixtures'; // CDP-attached; relative import is fine — e2e/ is eslint-ignored

test('<criterion summary>', async ({ page }) => {
    await page.goto('/<route from the spec>'); // baseURL is localhost:3000
    // drive the flow the criterion describes; assert the expected end state
});
```

- Use the `./fixtures` `test`/`expect` (attaches to the user's Chrome over CDP — already logged in).
- **Never** call `browser.close()`; the fixtures already open/close only their own tab.
- For wallet-gated steps, write the assertions but add a `// WALLET: <action>` comment at the step —
  the orchestrator pauses for the user there during the run; don't try to auto-confirm MetaMask.
- **If the e2e suite is missing**, skip this step and say so in your summary (`e2e skipped — no infra`);
  do **not** scaffold Playwright yourself.

## Step 3 — Fill the coverage matrix

Update `coverage.md`'s Test column so **every `AC-N` row** points at the file(s) that assert it (or
`visual-only` / `BLOCKED`). This is what the orchestrator gates on — an empty cell will block the pipeline.

## Step 4 — Return summary

Your final message is a return value to the orchestrator, not a user-facing note. Return:

```
files written:
  - apps/web/tests/foo/bar.test.ts — asserts AC-1, AC-2 (happy + empty-state)
  - e2e/bar.spec.ts — asserts AC-3 (full flow)
coverage: AC-1 ✅ AC-2 ✅ AC-3 ✅ AC-4 visual-only AC-5 BLOCKED   ← every AC accounted for
e2e: written | skipped (no infra)
blocked / ambiguous:
  - AC-5: <why it couldn't be made deterministic, with the question to ask the user> | none
```

## Hard rules

- **Tests only.** Never write or edit implementation/source files. Never make a failing test pass by
  weakening it.
- **RED is the goal.** Tests should fail now because the feature isn't built / the bug isn't fixed.
- **Every `AC-N` is accounted for in `coverage.md`** — a test file, `visual-only`, or `BLOCKED`. No empty cells.
- **Assertions are frozen contracts** — write them to be robust to interface changes (see "frozen" rule above).
- **English** in test names/comments (memory: `feedback_docs_language`).
- Don't pad with trivial tests to inflate the count; cover the spec, including the edge cases it names.

## Related skills

- `ff-spec` — produces the `spec.md` + `checklist.md` + `coverage.md` you consume (you fill the test column).
- `/ff-task` — the orchestrator that dispatches this skill as a subagent.
- `code-quality` / `/architecture` — repo rules the unit tests must satisfy.
- `superpowers:test-driven-development` — the red-green discipline this step embodies.
