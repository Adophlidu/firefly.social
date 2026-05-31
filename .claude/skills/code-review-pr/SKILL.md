---
name: code-review-pr
description: Comprehensive PR code review for Firefly. Use when reviewing PRs, code changes, or diffs — covers security (secrets/PII leakage, supply-chain, AuthN/AuthZ), code quality (React hooks, race conditions, null safety, error handling), and Firefly-specific patterns (layer-rule violations, ESM-shim usage, classNames, Lingui macros, memo, 'use client' placement). Triggers on "review PR", "review this PR", "code review", "check this diff", "review #123". Always use this skill for any PR review task in this repo, even if the user doesn't explicitly mention "code review".
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Firefly PR Code Review

**Output language**: English.

## Review Scope

- Base branch: `main`
- Diff: `git fetch origin && git diff origin/main...HEAD` (triple-dot)

## Workflow

1. **Checkout** — `gh pr checkout <PR_NUMBER>` (skip if already on the branch)
2. **Scope** — `git diff origin/main...HEAD --stat` to see change scope
3. **Triage** — Determine which review modules apply (see triage table)
4. **Primary Review** — Read each changed file, apply relevant checks from `references/`
5. **Independent Cross-Review** — Optionally dispatch a `general-purpose` Agent for an independent second-opinion review (see below)
6. **PR Comment Analysis** — Fetch all existing PR comments (bot + human), analyze with local codebase context (see below)
7. **Merge Findings** — Combine primary + cross-review + PR-comment findings, deduplicate, annotate confidence
8. **Score** — Rate the PR across 4 dimensions (see Scoring System). **MANDATORY — every report MUST include the scoring table.**
9. **Report** — Generate structured report using the unified format. **Follow the template exactly — every section is required.**
10. **GH Comment** — For Blocker issues, offer to post inline PR comments (with confirmation)

## Independent Cross-Review (optional)

For high-risk PRs (security-sensitive, large diffs, layer-rule changes), dispatch a `general-purpose` Agent for a parallel independent review:

```
Agent(
  subagent_type = "general-purpose",
  description = "Independent PR review",
  prompt = "Review this PR diff for the Firefly Web3 social platform monorepo. Focus on:
- Security vulnerabilities (secret leakage, auth bypass, supply-chain risks)
- Runtime bugs (race conditions, null safety, memory leaks, stale closures)
- Architecture violations (layer hierarchy in apps/web and across @dimensiondev/* packages)
- Code quality (React hooks safety, error handling, performance)
- Firefly-specific patterns (ESM shims, classNames, Lingui macros, memo, 'use client')
Report each finding with: file:line, severity (Critical/High/Medium/Low), description, fix suggestion.

Diff:
${FULL_DIFF}"
)
```

Merge into primary review:

- **Both found same issue** → Mark `{Cross-validated ✅}`, auto-promote to 🔵 High confidence.
- **Cross-review-only finding** → Include with tag `[Cross-review]`, review manually to assign confidence.
- **Primary-only finding** → Include normally.
- Add a **Cross-Review Summary** table in the report (see template).

If cross-review is skipped (smaller PR or user preference), set "Cross-review: ⏭️ skipped" in the report header. Do not mention it elsewhere.

## PR Comment Analysis

Collect ALL existing comments on the PR — bot and human — then analyze each with your local codebase context. You have full source access, type system, and dependency graph; most commenters only saw the diff. Use this asymmetry.

### Fetching All Comments

```bash
# Top-level PR reviews (review bodies)
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews \
  --jq '[.[] | select(.body != "") | {author: .user.login, is_bot: (.user.type == "Bot"), body: .body, state: .state, association: .author_association}]'

# Inline review comments (file:line annotations)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --jq '[.[] | {author: .user.login, is_bot: (.user.type == "Bot"), path: .path, line: .line, body: .body, association: .author_association}]'

# General PR comments (issue-level)
gh api repos/{owner}/{repo}/issues/{pr_number}/comments \
  --jq '[.[] | {author: .user.login, is_bot: (.user.type == "Bot"), body: .body, association: .author_association}]'
```

**Bot detection** — use `user.type == "Bot"` from the GitHub API, not hardcoded username lists.

If no comments exist, set "PR comment analysis: ⏭️ no comments" in the report header and skip this section.

### Analysis Framework

For each substantive comment (skip empty approvals, CI status badges, pure formatting):

| Verdict                | Meaning                                             | Action                                                        |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| **✅ Confirmed**       | Comment identifies a real issue                     | Include in findings, tag source `[<author>]`                  |
| **🔍 Enriched**        | Real issue, but analysis is shallow or fix is wrong | Include with deeper fix guidance from your codebase knowledge |
| **❌ Noise**           | Not an issue given full codebase context            | Note in "Comment Noise Analysis" with brief explanation       |
| **📋 Already Covered** | Your primary review caught it                       | Cross-validate, boost confidence                              |

**Your local advantages — use them aggressively:**

- Full source — trace data flow across files, not just the diff.
- Type system — run `pnpm typecheck`, verify types end-to-end.
- Architecture — you know Firefly's layer hierarchy (Layer 0 → Layer 1 → Layer 2 packages; in-app: helpers → store → services → hooks → components/modals).
- Dependencies — `pnpm why <pkg>`, changelogs, actual vulnerability reachability.
- Runtime reasoning — state flows, async lifecycles, race conditions.

When someone flags something vague, dig into the source to confirm or refute. When a comment misses context (e.g., a function is safely guarded upstream), explain why. When a comment is right, amplify with richer context.

### Cross-Validation Rules

- Comment + primary review agree → Mark `{Cross-validated ✅}`, promote to 🔵 High.
- Comment-only finding you confirm → Include at appropriate confidence with `[<author>]` tag.
- Comment-only finding you can't confirm or refute → Include as ⚪ Low with note.
- Comment you refute with evidence → Add to "Comment Noise Analysis" section.

### Security Comment Special Handling

For security-related comments (from bots like Snyk/Dependabot or from human reviewers):

- **Vulnerability reports** — check if the vulnerable code path is actually reachable in Firefly's usage.
- **License issues** — verify against the project's license policy.
- **Dependency alerts** — check if the flagged version is actually used (not just present in `pnpm-lock.yaml`).

## Triage: Which Checks to Run

Run `git diff origin/main...HEAD --name-only` and match:

| Changed Files Match                                                                                                                | Load                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`, `pnpm-lock.yaml`, `patches/*.patch`, `node_modules` patches                                                        | [security-and-supply-chain.md] — full supply-chain review                                                                      |
| `**/auth/**`, `**/signer/**`, `**/wallet/**`, `**/session/**`, anything under `apps/wallet/src/store/fireflySession.ts`-like files | [security-and-supply-chain.md] — full security review                                                                          |
| Any `.ts` / `.tsx` with business logic                                                                                             | [code-quality-patterns.md] — hooks, race conditions, null safety                                                               |
| Files in `apps/web/src/components/`, `modals/`, `hooks/`, `services/`, `providers/`, `store/`, `helpers/`                          | [firefly-patterns.md] — layer rules, ESM shims, classNames, Lingui, memo                                                       |
| Files in `apps/wallet/src/components/ui/` (shadcn), `apps/wallet/src/components/`, `apps/wallet/src/modals/`                       | [firefly-patterns.md] — shadcn/Radix conventions, Tailwind + `cn`, `react-native-web` notes                                    |
| Files in `apps/wallet/src/routes/perps.*.tsx` or `apps/wallet/src/components/Perps/`                                               | [firefly-patterns.md] — `@dimensiondev/rn-ui` public-surface imports only (whole screens + Provider); no Tamagui at this layer |
| `.github/workflows/*.yml`, scripts                                                                                                 | Build & CI section in [firefly-patterns.md]                                                                                    |

**Always check** regardless of file type:

- Accidental file commits (`.DS_Store`, `.env`, `node_modules`, `.eslintcache`)
- Layer hierarchy violations (see below)
- PR description matches actual changes
- Run relevant commands from [quick-commands.md]

## Layer Hierarchy (ALWAYS verify)

Firefly enforces two distinct hierarchies via ESLint custom rules.

### Workspace package layers (`@dimensiondev/*`)

```
Layer 0 (no @dimensiondev deps):
  @dimensiondev/utils, @dimensiondev/types, @dimensiondev/assets
       ↓
Layer 1 (Layer 0 only):
  @dimensiondev/constants, /envs, /hooks, /web3, /web3-utils,
  /native-bridge, /iframe-bridge, /rn-ui
       ↓
Layer 2:
  apps/web, apps/wallet
```

**Rule**: Layer 1 packages must NOT import sibling Layer 1 packages.

### In-app layers (`apps/web/src`)

```
HIGH (can import anything below):
  app/, components/, modals/
       ↓
  hooks/
       ↓
  services/, providers/
       ↓
  store/
       ↓
  helpers/
LOW (cannot import anything above)
```

### Quick grep for violations on changed files

```bash
# Workspace layer violation: Layer 1 importing sibling Layer 1
git diff origin/main...HEAD --name-only | grep -E '^packages/(hooks|web3|web3-utils|constants|envs|native-bridge|iframe-bridge|rn-ui)/' | \
  while IFS= read -r f; do [ -f "$f" ] && grep -Hn "from ['\"]@dimensiondev/\(hooks\|web3\|web3-utils\|constants\|envs\|native-bridge\|iframe-bridge\|rn-ui\)" "$f"; done

# In-app: store importing from hooks/components/modals (forbidden)
git diff origin/main...HEAD --name-only | grep -E '^apps/web/src/store/' | \
  while IFS= read -r f; do [ -f "$f" ] && grep -Hn "from ['\"]@/\(hooks\|components\|modals\)" "$f"; done

# In-app: service importing from a hook (forbidden)
git diff origin/main...HEAD --name-only | grep -E '^apps/web/src/services/' | \
  while IFS= read -r f; do [ -f "$f" ] && grep -Hn "from ['\"]@/hooks/" "$f"; done
```

See `/architecture` for the full rules including the SingletonModal pattern for opening modals across layers.

## File Risk Classification

| Risk         | Patterns                                                                                                                                   | Action              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| **Critical** | `**/signer/**`, `**/wallet/**`, `apps/wallet/src/store/fireflySession.ts`-like session files, `packages/web3/**`, `packages/web3-utils/**` | Line-by-line review |
| **High**     | `**/auth/**`, API providers (`apps/web/src/providers/`), state stores (`apps/web/src/store/`), `package.json`, `pnpm-lock.yaml`            | Deep review         |
| **Medium**   | UI components, hooks, services                                                                                                             | Standard review     |
| **Low**      | Comments, type-only, formatting, tests, docs                                                                                               | Scan for anomalies  |

## Scoring System

**MANDATORY** — every report must include this scoring table.

Rate the PR on 4 dimensions (1–10 each):

| Dimension           | Weight | What to evaluate                                                       |
| ------------------- | ------ | ---------------------------------------------------------------------- |
| **🔒 Security**     | 35%    | Secret leakage, auth bypass, supply-chain risk, input validation       |
| **💎 Code Quality** | 30%    | Hooks safety, error handling, race conditions, null safety, DRY        |
| **🏛️ Architecture** | 20%    | Layer hierarchy, separation of concerns, ESM-shim usage, modal pattern |
| **✅ Completeness** | 15%    | Edge cases handled, test coverage, migration paths, docs               |

**Total Score** = weighted average, rounded to 1 decimal.

| Score          | Verdict                           | Action                                         |
| -------------- | --------------------------------- | ---------------------------------------------- |
| **8.0 – 10.0** | ✅ Mergeable as-is                | No blockers, minor suggestions only            |
| **5.0 – 7.9**  | ⚠️ Needs changes before re-review | Has issues that should be fixed before merge   |
| **< 5.0**      | ❌ Send back for rework           | Fundamental issues in security or architecture |

**Scoring anchors** — to keep scores consistent:

- Start at 8 for each dimension, deduct for issues found.
- A single Critical security issue → Security capped at 3.
- A single High bug → Code Quality capped at 5.
- A layer-hierarchy violation → Architecture capped at 4.

## Confidence Levels

**MANDATORY** — every finding must use exactly one of these three emoji tags:

| Tag           | Meaning                           | When to use                                    |
| ------------- | --------------------------------- | ---------------------------------------------- |
| **🔵 High**   | Confirmed, verifiable from code   | Clear bug, obvious violation, reproducible     |
| **🟠 Medium** | Likely issue, needs context       | Pattern suggests problem, might be intentional |
| **⚪ Low**    | Possible issue, needs human check | Heuristic match, depends on business logic     |

Cross-validated findings (primary + cross-review agree, or primary + PR comment agree) → automatically **🔵 High**.

## Auto-Fix Patches

**MANDATORY for these categories** — if a finding matches one of these, you MUST include a diff patch:

- `console.error / warn / log` → project logger
- Missing optional chaining on nullable refs
- Layer hierarchy violations
- Missing cleanup in `useEffect`
- Missing `.js` extension on `@/` imports
- Direct `next/image` / `next/link` / `next/navigation` imports → ESM shims
- `clsx` / `cx` / template-literal class names → `classNames` from `@dimensiondev/utils`
- Hardcoded user-visible strings without Lingui wrapping
- Missing `memo()` on non-trivial components
- `'use client'` not on the first line of a client component

**Format — always use this exact structure:**

```markdown
**Auto-fix:**
\`\`\`diff

- old code

* new code
  \`\`\`
```

For other findings where the fix is unambiguous and doesn't require business context, also include auto-fix. When in doubt, include it.

Do NOT generate auto-fix for:

- Logic changes requiring business context understanding.
- Security fixes needing architectural decisions.
- Performance optimizations with trade-offs.

## GH CLI Inline Comments

After generating the report, if there are findings that meet the comment threshold:

**Comment threshold**: 🔴 High priority (any confidence) OR 🟡 Medium priority with 🔵 High confidence. This means:

- All 🔴 High findings (regardless of confidence).
- All 🟡 Medium findings with 🔵 High confidence (cross-validated or confirmed from code).
- Excludes: 🟢 Low findings, and 🟡 Medium with 🟠 Medium or ⚪ Low confidence.

1. List the qualifying findings that warrant PR comments.
2. **Ask the reviewer**: "These findings can be posted as inline PR comments. Confirm to send?"
3. **Only after explicit yes**, post via:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --field body="🟡 **<title>**: <description>

**Suggested fix:**
\`\`\`suggestion
<fix code>
\`\`\`

_— Auto-review by Claude_" \
  --field path="path/to/file.tsx" \
  --field line=42 \
  --field side="RIGHT" \
  --field commit_id="$(git rev-parse HEAD)"
```

**Rules:**

- Never post without explicit reviewer confirmation.
- Only post findings meeting the comment threshold.
- Include auto-fix in a `suggestion` block when available.
- Maximum 5 inline comments per PR.

## Unified Report Format

**CRITICAL: Follow this template exactly. Every section marked [REQUIRED] must appear in every report. Do not skip or reorder sections.**

```markdown
# PR #NUMBER Code Review

## Overview [REQUIRED]

- **Scope**: X files, +Y / -Z lines
- **Risk level**: Critical / High / Medium / Low
- **Affected surfaces**: apps/web / apps/wallet / packages/<name>
- **Cross-review**: ✅ enabled / ⏭️ skipped
- **PR comment analysis**: ✅ analyzed (N comments, M from bots) / ⏭️ no comments

## Scoring [REQUIRED — NEVER SKIP THIS SECTION]

| Dimension       | Score      | Notes                                           |
| --------------- | ---------- | ----------------------------------------------- |
| 🔒 Security     | X/10       | brief notes                                     |
| 💎 Code Quality | X/10       | brief notes                                     |
| 🏛️ Architecture | X/10       | brief notes                                     |
| ✅ Completeness | X/10       | brief notes                                     |
| **Total**       | **X.X/10** | **✅ Mergeable / ⚠️ Needs changes / ❌ Rework** |

## Cross-Review Summary [REQUIRED if cross-review ran, OMIT otherwise]

| Finding     | Primary | Cross-review | Status                                             |
| ----------- | ------- | ------------ | -------------------------------------------------- |
| description | Yes/No  | Yes/No       | Cross-validated / Primary-only / Cross-review-only |

## PR Comment Analysis [REQUIRED if comments exist, OMIT otherwise]

| Source    | Type     | Finding            | Verdict      | Notes                       |
| --------- | -------- | ------------------ | ------------ | --------------------------- |
| Snyk      | 🤖 Bot   | dep vuln CVE-XXXX  | ✅ Confirmed | path reachable in Firefly   |
| @reviewer | 👤 Human | missing null check | 🔍 Enriched  | upstream hook handles this  |
| Bot       | 🤖 Bot   | variable naming    | ❌ Noise     | matches project conventions |

### Comment Noise Analysis [OMIT if no noise findings]

- **[source] noise**: explanation of why it's not an issue, with source-code citation.

## Findings [REQUIRED]

### [🔴 High] [🔵 High] <title> {Cross-validated ✅}

**File**: `path/to/file.tsx:42`
**Type**: security / build / runtime / performance / convention
**Description**: what the issue is and why it's a risk
**Auto-fix:**
\`\`\`diff

- old code

* new code
  \`\`\`

---

### [🟡 Medium] [🟠 Medium] <title>

**File**: `path/to/file.tsx:18`
**Type**: runtime
**Description**: ...
**Suggested fix**: ...

---

## Action Items [REQUIRED]

| Priority  | Confidence | File         | Type     | Description | Auto-fix |
| --------- | ---------- | ------------ | -------- | ----------- | -------- |
| 🔴 High   | 🔵 High    | file1.tsx:42 | security | description | ✅       |
| 🟡 Medium | 🟠 Medium  | file2.tsx:18 | runtime  | description | —        |

## Test Plan [REQUIRED]

1. test scenario
2. test scenario

## GH Comment Action [REQUIRED if qualifying findings exist, OMIT otherwise]

The following findings (🔵 High confidence + 🟡 Medium or above priority) are recommended for inline PR comments:

- [ ] issue 1 — `file.tsx:42`
- [ ] issue 2 — `file.tsx:88`

> Confirm to send via `gh` CLI as inline comments.
```

## Priority Definitions

| Priority      | Criteria                                                | Action                  |
| ------------- | ------------------------------------------------------- | ----------------------- |
| **🔴 High**   | Build failure, security vulnerability, data loss, crash | Must fix before merge   |
| **🟡 Medium** | Runtime bug, incorrect behavior, maintainability        | Should fix before merge |
| **🟢 Low**    | Nice-to-have, minor inconsistency                       | Can fix in follow-up    |

## Review Discipline

- **Read the code** — don't just grep. Read each changed file to understand intent.
- **No false positives** — only report issues you're confident about. Uncertain? Lower the confidence.
- **No style nitpicks** — focus on security, correctness, architecture, performance.
- **Context matters** — understand why the code was written this way before suggesting changes.
- **Prioritize** — 3 high-quality findings beats 20 marginal complaints.
- **Score honestly** — the score reflects reality, not diplomacy.
- **Auto-fix aggressively** — when the fix is clear, always include a diff patch.

## Reference Files

- [references/security-and-supply-chain.md](references/security-and-supply-chain.md) — PII leakage, AuthN/AuthZ, supply-chain, manifest permissions
- [references/code-quality-patterns.md](references/code-quality-patterns.md) — Hooks, race conditions, null safety, concurrent requests, error handling
- [references/firefly-patterns.md](references/firefly-patterns.md) — Layer rules, ESM shims, classNames, Lingui, memo, 'use client', rn-ui
- [references/quick-commands.md](references/quick-commands.md) — Bash one-liners for automated checking

## Related Skills

- **`code-quality`** — The author-side companion to this review skill. Same rule set, applied while writing code. Use it to cross-check that the suggestion you're about to make in a review (English-only comments, no `clsx`, no relative imports, etc.) matches what the author was supposed to follow.
- **`vercel-react-best-practices`** — When the diff is heavily React/Next.js code (components, hooks, server actions, data fetching, bundle config), also consult this skill for impact-rated performance rules grouped by prefix: `async-*`, `bundle-*`, `server-*`, `client-*`, `rerender-*`, `rendering-*`, `js-*`, `advanced-*`. Cite the specific rule name in findings when relevant (e.g., "Violates `async-parallel`: sequential awaits where Promise.all is safe").
