---
name: resolve-jira-issue
description: Take a Firefly Jira issue (URL or `FW-XXXX` key, on `mask.atlassian.net`), fetch it, classify it as Bug vs Feature/Task, produce a complete execution plan, gate on user confirmation, then implement. Auto-extracts Figma links from the Jira description for UI work; asks the user if missing. Use whenever the user pastes a Jira URL like `https://mask.atlassian.net/browse/FW-7406`, mentions a `FW-XXXX` key, or asks to "fix this bug" / "implement this task" / "做这个需求" / "修这个 bug".
---

# Resolve Firefly Jira Issue

End-to-end workflow that turns a Firefly Jira issue (bug or feature) into shipped code:

```
Jira URL → fetch (Atlassian MCP) → classify (Bug vs Feature) → build execution plan
       → user confirms → implement → verify in real browser (Playwright + Figma diff)
       → suggest /create-pr
```

The user **must approve the plan before any code edits.** No silent execution. Verification is driven by this skill — Claude runs the dev server, walks the page in Playwright, captures screenshots, and reports back. The user reviews the evidence, not runs the checks.

## When to trigger

- User pastes a URL matching `https://mask.atlassian.net/browse/FW-NNNN`.
- User mentions a bare `FW-NNNN` issue key in any context that implies "do this".
- User says "fix this bug" / "implement this task" / "做这个需求" / "修这个 bug" / "完成这个 jira" with a Jira reference nearby.

Do **not** trigger for:

- Generic Jira questions ("how do I query Jira", "list my issues") — that's a Jira reporting task, not an implementation one.
- The reverse direction (code → Jira summary) — that's a different workflow.

## Hard rules

- **User confirmation gate is non-negotiable.** Present the plan, wait for explicit approval, then code. Never skip ahead.
- **Quote the Jira issue accurately.** Don't paraphrase requirements out of recognition. If the description is ambiguous, ask a question — don't guess.
- **Branch name and PR title carry `FW-NNNN`.** Firefly CI (`jira-issue-key-checking.yml`) enforces this in the PR title; the `/create-pr` skill handles it automatically if you pass the key through.
- **English only in committed artifacts** (memory: `feedback_docs_language.md`). Chat with the user in their language; commit messages, code comments, and PR body are English.
- **Convert relative dates** ("today", "this week") to absolute dates (`2026-05-12`) when summarising back to the user.

## Step 1: Fetch the Jira issue

### 1a. Parse the input

| Input shape                                 | Extract                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `https://mask.atlassian.net/browse/FW-7406` | `cloudSite: mask`, `key: FW-7406`                     |
| `FW-7406` bare                              | `key: FW-7406`, site defaults to `mask.atlassian.net` |
| Just a URL fragment with `FW-NNNN`          | extract the key with regex `FW-\d+`                   |

### 1b. Try the Atlassian MCP first

```
ToolSearch(query="+atlassian jira", max_results=10)
```

If tools like `mcp__atlassian__get-issue-by-key` (or similar — name varies by MCP version) appear, load their schemas and call:

```
mcp__atlassian__getAccessibleAtlassianResources()   # find the cloudId for mask.atlassian.net
mcp__atlassian__get-issue-by-key({
  cloudId: "<resolved>",
  issueIdOrKey: "FW-7406",
})
```

You need at least: `issuetype.name`, `summary`, `description` (often ADF/JSON — flatten to text), `status.name`, `priority.name`, `labels`, `assignee.displayName`, `reporter.displayName`, attachments, comments. Pull comments too — context often lives there.

### 1c. Fallback when Atlassian MCP isn't available

If `ToolSearch` returns nothing for Atlassian, tell the user once:

> Atlassian MCP isn't enabled in this workspace. Either:
>
> 1. Paste the Jira issue's title + description + acceptance criteria + any attachments/Figma links here, and I'll continue from that, **or**
> 2. Enable an Atlassian MCP plugin in `.claude/settings.json` (e.g., the official Atlassian one), then re-run.

Don't loop on this — accept whichever choice the user makes and proceed.

## Step 2: Classify as Bug or Feature

Primary signal: **`issuetype.name`** from Jira:

| Jira issue type                            | Treat as                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `Bug`                                      | Bug                                                                                  |
| `Task`, `Story`, `Sub-task`, `New Feature` | Feature                                                                              |
| `Improvement`                              | Usually Feature; if the wording reads like "regression" or "incorrect behavior", Bug |
| `Epic`                                     | Too big for a single execution plan — ask user to point at a specific child issue    |
| Anything else                              | Ask the user which mode to use                                                       |

Secondary signals (use to confirm or escalate ambiguous cases):

- Bug indicators: "steps to reproduce", "expected vs actual", screenshots showing brokenness, reporter is QA, words like "crash", "wrong", "broken", "regression", "fix"
- Feature indicators: acceptance criteria, Figma URL in description, reporter is PM, words like "add", "support", "implement", "new"

If both signals fight, ask **one** clarifying question to the user, then proceed.

## Step 3: Build the execution plan

The plan template depends on which mode you're in.

### 3a. Bug Plan template

Use this exact structure:

```markdown
## Bug Fix Plan — FW-NNNN: <title from Jira>

### Symptom (from Jira)

<one-paragraph summary of what's broken, quoting the reporter where useful>

### Reproduction steps

1. ...
2. ...
3. ... → observed: ... | expected: ...

### Affected surface

- Surface: apps/web | apps/wallet | packages/<name>
- Likely entry points: `path/to/file.tsx:LINE`, `path/to/other.ts`

### Hypothesised root cause

<short paragraph based on reading the code, not just speculation>

### Proposed fix

<concrete approach — name the file(s), describe the change in 2–4 bullets>

### Risk

- Risk level: Low / Medium / High
- Blast radius: <which features / users this fix touches>
- Potential regressions to watch: <list>

### Verification (executed in Step 7, not by the user)

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` pass for the affected package(s)
- [ ] Dev server boots cleanly on localhost (apps/web :3000 or apps/wallet :3001)
- [ ] Playwright walks the **reproduction steps from this plan** and the bug **no longer reproduces** — screenshots captured at each step
- [ ] Browser console has no new errors during the walk
- [ ] (Optional) regression test added at `path/to/test.spec.ts`

### Open questions for the user

<list any ambiguities. Empty section if none.>
```

Before drafting this, do a **focused codebase exploration** to ground the hypothesised root cause and the proposed fix in real file paths. Use the `Explore` Agent type if the affected area is unfamiliar — don't speculate.

Consider invoking `superpowers:systematic-debugging` if the bug is non-obvious (e.g., race conditions, intermittent, environment-specific).

### 3b. Feature Plan template

Use this exact structure:

```markdown
## Feature Implementation Plan — FW-NNNN: <title from Jira>

### Requirement summary (from Jira)

<one-paragraph rewrite of the PM's ask in plain language>

### Acceptance criteria

- [ ] <criterion 1, from Jira>
- [ ] <criterion 2>
- ...

### Design reference

- Figma: <URL, extracted from Jira description, or "TBD — ask user">
- Screenshot/attachment: <URL or "none">

### Affected surface

- Primary surface: apps/web (Next.js) | apps/wallet (Vite + shadcn) | packages/rn-ui (Tamagui) | <other>
- Why this surface: <one sentence — match where the user lives>

### Files to create

- `path/new-component.tsx` — <purpose>
- `path/new-service.ts` — <purpose>

### Files to modify

- `path/existing.tsx:LINE` — <what change>
- `path/parent.tsx` — <wire up entry point>

### Implementation strategy

<3–6 bullets. For UI-heavy work, follow the three-pass model from `implementing-figma-designs`:>

1. UI pass with mock data
2. i18n pass (Lingui `<Trans>` / ` t` ``)
3. Data pass (wire real hooks / services / providers)

### Layer / restricted-pattern checks (from `/architecture` + `CLAUDE.md`)

- Layer hierarchy respected (apps/web: components/modals → hooks → services → store → helpers)
- `@/` imports with `.js` extension; no relative `../`
- `classNames` (apps/web) or `cn` (apps/wallet) for class strings
- ESM shims for `next/image` / `next/link` / `next/navigation` / `next/dynamic`
- `'use client'` on first line where needed
- Lingui macros from `@lingui/react/macro` / `@lingui/core/macro`
- Non-trivial components wrapped with `memo()`

### Verification (executed in Step 7, not by the user)

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` pass for the affected package(s)
- [ ] Dev server boots cleanly on localhost (apps/web :3000 or apps/wallet :3001)
- [ ] Playwright walks **each acceptance criterion** in the running app — screenshots captured at each step
- [ ] Each criterion's "Done" state matches the Figma reference (if present): per-criterion side-by-side captures saved
- [ ] Visual delta vs Figma documented (color / spacing / font-size / icon / copy mismatches listed, or "no notable diffs")
- [ ] Browser console has no new errors during the walk
- [ ] i18n keys appear in `apps/web/src/locales/en/messages.po` after `pnpm lingui` (CI runs this automatically; only required locally if you need to verify pre-merge)

### Open questions for the user

<list any ambiguities. Empty section if none.>
```

For genuinely open-ended features, consider invoking `superpowers:brainstorming` before drafting the plan.

## Step 4: Handle Figma references

For Feature plans, after extracting initial Jira context:

1. **Scan the Jira description and comments for `figma.com` URLs.** If found:
    - Call `mcp__plugin_figma_figma__get_metadata({ url })` to confirm validity.
    - Call `mcp__plugin_figma_figma__get_design_context({ fileKey, nodeId })` for the relevant node. (Parse URL: `figma.com/design/:fileKey/...?node-id=:nodeId`, converting `-` to `:` in the nodeId.)
    - Embed the extracted code reference + token mapping in the "Implementation strategy" section.
2. **If no Figma URL is found** and the work is UI-shaped, ask the user:
    > This looks like UI work but I don't see a Figma link in the Jira issue. Do you have one? (Paste the URL, or say "no Figma" if it's developer-discretion UI.)
3. **If Bug + visual regression**, also ask whether there's a Figma showing the intended look (often there is for layout regressions; less often for behavioral bugs).

When you do consult Figma, follow the conventions in the **`implementing-figma-designs`** skill — UI-first with mock data, then i18n, then data; respect firefly-specific patterns (shadcn in apps/wallet, Tailwind in apps/web, Tamagui only inside `packages/rn-ui/src/`).

## Step 5: Present plan + gate on confirmation

Post the plan in chat. Then **stop and wait**. Acceptable user responses:

- "Looks good" / "Go" / "Approved" → proceed to Step 6.
- A list of edits → revise the plan, re-post, wait again.
- "Hold on, let me check X" → wait. Don't ping. Don't proceed.

Don't post the plan and then start coding in the same turn — that defeats the gate.

## Step 6: Execute

After approval:

1. **Create a feature branch** following `/commit` conventions:
    - Bugs: `fix/<short-description>` (e.g. `fix/perps-tab-stale-data`)
    - Features: `feat/<short-description>` (e.g. `feat/multi-network-search`)
    - Other: `refactor/`, `chore/`, etc.
2. **Implement** following the plan. For each step:
    - Consult `code-quality` for in-flight rules.
    - For Figma-driven UI work, consult `implementing-figma-designs`.
    - For perps screens, the visual work lives in `packages/rn-ui/src/` — apps/wallet just mounts the screens.
    - If a hard architectural decision comes up that wasn't in the plan, **pause and revise the plan first** — don't silently expand scope.
3. After all code changes are in, proceed to Step 7 — **do not claim "done" yet**.

## Step 7: Verify in a real browser

The verification checklist in the plan is executed here, not delegated to the user. Drive the verification end-to-end and report evidence (commands run + screenshots).

### 7a. Static checks first (cheap, fail fast)

```bash
pnpm typecheck --filter=<affected-package>
pnpm lint --filter=<affected-package>
pnpm test --filter=<affected-package>
```

If any fail, fix and re-run before booting a browser. Don't proceed past this gate.

### 7b. Start the dev server in the background

Pick the right app based on the affected surface:

| Surface       | Command                                          | Default URL             |
| ------------- | ------------------------------------------------ | ----------------------- |
| `apps/web`    | `pnpm --filter=@dimensiondev/firefly-web dev`    | `http://localhost:3000` |
| `apps/wallet` | `pnpm --filter=@dimensiondev/firefly-wallet dev` | `http://localhost:3001` |

Run via `Bash` with `run_in_background: true`. Save the returned `shellId` — you'll need it to read output and to kill the server at the end. Poll the URL until it responds (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` returns 200 / 304 / 307) before opening a browser; first build can take 30–60s on a cold cache.

If the server crashes during boot (use `BashOutput` to read stderr from the shell), report the error to the user and stop — don't try to verify against a broken server.

### 7c. Drive a Playwright session

Use Microsoft's Playwright MCP (`mcp__plugin_playwright_playwright__*`). Tool names you'll need:

- `browser_install` — first run only; installs Chromium. Skip if already installed.
- `browser_resize` — pin to a deterministic size, e.g. `{ width: 1440, height: 900 }` for desktop, `{ width: 390, height: 844 }` for mobile-shaped flows.
- `browser_navigate` — go to a URL.
- `browser_snapshot` — accessibility-tree snapshot, used to find elements (cheaper than screenshots).
- `browser_click` / `browser_type` / `browser_press_key` — interact.
- `browser_wait_for` — wait for text, time, or element.
- `browser_take_screenshot` — visual evidence. Save with a descriptive filename.
- `browser_evaluate` — run JS in the page when no other tool fits (e.g., read localStorage).
- `browser_console_messages` — pull console output to confirm no new errors.
- `browser_close` — at the end.

**Screenshot location:** `node_modules/.cache/verification/FW-NNNN/`. Create the dir with `mkdir -p` if needed. Filename pattern: `<step-number>-<short-slug>.png` (e.g., `01-initial-load.png`, `02-after-click-submit.png`, `03-error-state.png`).

### 7d. Walk the steps from the plan

**For Bug fixes** — walk the reproduction steps that were in the plan:

1. Navigate to the entry point (e.g. `http://localhost:3000/profile/alice.lens`).
2. Screenshot the initial state (`01-initial-load.png`).
3. Perform each reproduction step (clicks, fills, keypresses). After each meaningful step, take a screenshot.
4. At the moment the bug previously surfaced, capture the screenshot. **The bug must not reproduce.** If it still does, the fix didn't work — go back to Step 6, don't paper over it.
5. After the final step, capture the "fixed" state (`NN-final-state.png`).
6. Read `browser_console_messages` and confirm no new errors appeared during the walk. (Pre-existing warnings unrelated to this fix are OK; note them in the report.)

**For Features** — walk each acceptance criterion:

1. Navigate to the entry point for the new feature.
2. For each acceptance criterion in the plan:
    - Screenshot the "before" / "default" state.
    - Perform the user actions described in the criterion.
    - Screenshot the "expected outcome" state.
    - If the criterion describes a negative path (e.g. "shows error when offline"), also capture that screenshot.
3. Read `browser_console_messages` for any errors during the walk.

### 7e. Figma comparison (Features with a Figma reference)

If the plan has a Figma URL, pull the design screenshot for direct comparison:

```
mcp__plugin_figma_figma__get_screenshot({
  fileKey: "<from URL>",
  nodeId: "<from URL — convert '-' to ':'>",
})
```

Save the Figma export to `node_modules/.cache/verification/FW-NNNN/figma-<short-slug>.png`. Then for each Playwright screenshot of the matching screen, list the **visual delta** as concrete items:

- Color: `#A3A3A3` (impl) vs `#9CA3AF` (Figma) on `.profile-handle` — likely tailwind token mismatch (`text-gray-400` vs `text-gray-500`)
- Spacing: `gap-3` (impl, 12px) vs Figma's 16px — bump to `gap-4`
- Font weight: 400 (impl) vs 500 (Figma) on the bio paragraph
- Icon: outlined (impl) vs solid (Figma) on the verification badge
- Copy: "Sign in" (impl) vs "Log in" (Figma)

If there are no notable diffs, say so explicitly: "No notable visual diffs vs Figma."

### 7f. Cleanup

- Kill the dev server: use the `KillShell` tool with the shellId from 7b.
- Close the browser: `browser_close`.
- Leave the screenshots — they're useful artefacts for the PR.

### 7g. Report findings

Present a structured verification report in chat with:

```
## Verification Report — FW-NNNN

### Static checks
- typecheck: ✅ / ❌
- lint: ✅ / ❌
- test: ✅ / ❌

### Browser walkthrough (apps/web :3000)
- Bug fixes: <bug no longer reproduces / still reproduces — details>
- Features: criterion-by-criterion ✅/❌ list with screenshots
- Screenshots: `node_modules/.cache/verification/FW-NNNN/*.png` (N images)

### Figma delta (features only, when applicable)
- <list of concrete diffs, or "no notable diffs">

### Console errors
- <list any new errors observed, or "none">

### Outstanding issues
- <anything not covered by the plan, edge cases discovered, regressions noticed>
```

Then attach the screenshots inline so the user can see them without opening files.

**If anything in 7a–7e failed**, do NOT proceed to Step 8. Fix the issue, then re-run the verification — don't claim "done with caveats."

## Step 8: Close out

After verification passes:

1. **Suggest `/create-pr`** to open the PR. Pass `FW-NNNN` so it lands in the title (CI requires it).
2. **Update the Jira issue** (only if user wants) with the PR link — this is optional and can happen via the Jira UI; we don't write back from this skill.
3. Report a one-line summary back to the user:
    > Implemented FW-7406. Branch `fix/perps-tab-stale-data` pushed. Ready for `/create-pr`.

If verification revealed something not covered by the original plan (a new edge case, an unexpected regression), report it instead of papering over it.

## Anti-patterns

- ❌ **Starting to code before user approves the plan.** The gate is the whole point.
- ❌ **Paraphrasing Jira requirements until they say something the code can satisfy.** Quote, don't twist.
- ❌ **Treating "Improvement" as automatically Feature.** Read the description; some are regression fixes.
- ❌ **Skipping Figma extraction when there's a link in the Jira description.** Always grab it — the design will surface details the description doesn't.
- ❌ **Putting Tamagui primitives in apps/wallet or apps/web.** They go only in `packages/rn-ui/src/`. (Re-read `implementing-figma-designs` if tempted.)
- ❌ **Branch name or PR title without `FW-NNNN`.** CI will block it.
- ❌ **AI attribution lines in commit messages.** Forbidden by `CLAUDE.md` and `/commit`.
- ❌ **Claiming "verified" without actually running the verification commands.** Pair every claim with the evidence (command + output + screenshot).
- ❌ **Skipping the Playwright walkthrough for UI changes.** `pnpm typecheck` / `pnpm lint` / `pnpm test` verify code correctness, not feature correctness. If a UI change touched, the browser walk in Step 7 is non-negotiable.
- ❌ **Leaving the dev server running after verification.** Always `KillShell` it in Step 7f. Forgotten dev servers chew CPU and confuse the next session.
- ❌ **Reporting "no visual diffs" without actually overlaying the Figma export.** Pull the Figma screenshot, list concrete diffs (or explicitly say "no notable diffs after comparing the two").
- ❌ **Pasting screenshots without filenames the user can open.** Screenshots live at `node_modules/.cache/verification/FW-NNNN/*.png` — name them descriptively (`01-initial-load.png`, `03-error-state.png`).
- ❌ **Overwriting the Jira issue from this skill.** This skill is read-only on Jira. Code → Jira sync is a separate concern.

## Related skills

- `/architecture` — canonical layer rules; cite when making structural decisions.
- `/commit` — pre-commit checks + conventional commit + branch-name conventions.
- `/i18n` — Lingui workflow; consult during the i18n pass.
- `/rn-ui` — entry points for `@dimensiondev/rn-ui` (perps screens).
- `code-quality` — author-side rule reference; the SKILL.md checklist mirrors this skill's verification section.
- `code-review-pr` — reviewer-side companion; you don't run it here, but a reviewer will.
- `create-pr` — opens the PR with FW-NNNN in the title once the work is done and verified.
- `implementing-figma-designs` — three-pass workflow used when this issue is UI-shaped.
- `monitor-pr-ci` — after the PR is up, watch CI + reviews until clean.
- `vercel-react-best-practices` — consult during React/Next.js implementation (perf rules).
- `superpowers:systematic-debugging` — for non-obvious bugs.
- `superpowers:brainstorming` — for genuinely open-ended features before drafting the plan.
- `group-think` — for hard architectural decisions where you want multiple perspectives before committing to an approach.
