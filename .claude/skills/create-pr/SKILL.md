---
name: create-pr
description: Creates a Pull Request from current changes in Firefly. Handles branch creation, pre-checks, commit, push, and PR creation with conversation context extraction. Use when user wants to "open a PR", "submit changes", or finish a feature branch. For commit-only without push/PR, use `/commit` instead.
disable-model-invocation: true
---

# Create Firefly PR

End-to-end PR creation for Firefly. Extracts intent and context from the conversation, runs Firefly's CI-equivalent pre-checks, commits with conventional format, pushes, and opens a PR with a structured body.

**Relationship to `/commit`**: `/commit` stops at the commit. This skill continues through push and PR creation, and extracts richer context from the conversation. Use `/commit` if you only need a commit; use this for the full PR flow.

## Quick Reference

| Step | Action                                          | Command                                                       |
| ---- | ----------------------------------------------- | ------------------------------------------------------------- |
| 1    | Check status                                    | `git status`, `git branch --show-current`                     |
| 2    | Create feature branch (if on `main`/`released`) | `git checkout -b <branch>`                                    |
| 3    | Pre-checks                                      | `pnpm typecheck`, `pnpm lint`                                 |
| 4    | Stage & commit                                  | `git add <files>`, `git commit -m "type(scope): description"` |
| 5    | Push                                            | `git push -u origin <branch>`                                 |
| 6    | Extract context from conversation               | (analysis, no commands)                                       |
| 7    | Create PR                                       | `gh pr create --base main --title "..." --body "..."`         |
| 8    | Return PR URL                                   | `open <PR_URL>`                                               |

## Workflow

### 1. Check Current Branch Status

```bash
git status
git branch --show-current
```

### 2. Branch Handling

**If on `main` or `released`** — STOP. Never commit or PR from these branches.

- Analyze the staged + unstaged changes
- Propose a branch name based on the change type:
    - `feat/<short-description>` — new feature
    - `fix/<short-description>` — bug fix
    - `chore/<short-description>` — tooling, config, deps
    - `refactor/<short-description>` — code restructure
    - `docs/<short-description>` — documentation only
- Create and switch: `git checkout -b <branch-name>`

**If already on a feature branch**, continue.

### 3. Pre-checks (match Firefly's CI)

Run before committing. Firefly's CI blocks on `typecheck`, `eslint`, `test`, `spellcheck`, and conventional-commits validation.

```bash
pnpm typecheck   # tsgo, fast
pnpm lint        # ESLint 9 via Turbo
```

If either fails:

- Type errors: fix them, do not bypass.
- Lint errors: try `npx eslint . --fix --cache --cache-location .eslintcache` first, then fix remaining issues by hand.

Do NOT skip pre-checks with `--no-verify`. If a check is fundamentally broken (not caused by this PR), surface that to the user instead of bypassing.

### 4. Stage and Commit

```bash
git add <specific files>   # prefer named files over `git add -A`
git commit -m "type(scope): description"
```

**Commit format** (Firefly conventional commits, validated by `amannn/action-semantic-pull-request`):

```
type(scope): description
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`, `ci`, `build`, `revert`.

Common Firefly scopes: `web`, `wallet`, `rn-ui`, `utils`, `constants`, `exception-tracker`, `hooks`, `web3`, `web3-utils`, `native-bridge`, `iframe-bridge`, `assets`, `envs`.

**Rules:**

- Keep the first line ≤ 72 characters.
- NEVER add `Co-Authored-By: Claude` or any AI attribution.
- One commit per logical concern. Suggest splitting if multiple unrelated changes are staged.
- cspell checks commit messages — propose `cspell.json` additions for new technical terms.

### 5. Push to Remote

```bash
git push -u origin <branch-name>
```

### 6. Extract Context (CRITICAL — do this before drafting the PR body)

Analyze the conversation history to extract:

- **Intent** — Why were these changes made? What problem was being solved?
- **Root Cause** — For bug fixes, what was the actual cause? Cite the file/line that drove the diagnosis.
- **Design Decisions** — What approaches were considered? Why was the chosen approach picked?
- **Trade-offs** — Any compromises or known limitations?
- **Risk Areas** — Which parts of the change are riskiest or most complex?
- **Surface Impact** — Which apps/packages are affected? (`apps/web`, `apps/wallet`, etc.)
- **Jira Issue** — Any `FW-{number}` issue ID mentioned in conversation or branch name. The `Check Jira Issue Key` workflow validates that the PR title contains `FW-XXX`.

**Context extraction guidelines:**

1. Quote the user's original request if it captured the problem cleanly.
2. Describe how the problem was diagnosed (especially for bugs).
3. Explain why this approach was chosen over alternatives discussed in the conversation.
4. Note any constraints or requirements the user mentioned.
5. Flag any edge cases that were discussed but not yet covered.

### 7. Create PR

```bash
gh pr create --base main --title "<title>" --body "<body>"
```

**Title:**

- Mirror the conventional commit format: `feat(scope): description`
- If a Jira issue was identified, append it: `feat(wallet): support new chain (FW-1234)`
- Keep ≤ 72 chars

**Body template** — the structure mirrors `.github/PULL_REQUEST_TEMPLATE.md` (passing `--body` overrides GitHub's template auto-fill, so reproduce it here). Omit optional parts that don't apply (do NOT write "N/A"):

```markdown
Closes FW-XXXX

## Description

<1–3 bullets describing WHAT changed, then the context a reviewer needs:
WHY the change was made (quote the user's request when it helps), the root
cause and how it was diagnosed (for bug fixes), key design decisions and
alternatives considered, and which parts are riskiest.>

**Risk**: Low / Medium / High — affected surfaces: apps/web / apps/wallet / packages/<name>

## Screenshots

<Screenshots or a screen recording of the visual changes. Delete this
section for non-visual changes.>

## Ready?

Did you do any of the following? If not, no worries, but if you can
it's really helpful.

- [ ] Documented what's new
- [ ] Added in-code documentation (wherever needed)
- [ ] Wrote tests for new components/features
- [ ] Ran the linter to ensure style guidelines were followed
- [ ] Created a story
- [ ] **AI PRs:** Manually verified the changes work as intended
```

**Template rules:**

- `Closes FW-XXXX` — first line, linked to the Jira issue. Omit the line entirely if there is no issue (see the Jira note below).
- Keep the `## Ready?` checklist verbatim. Check only the items that are actually true for this PR.
- NEVER check "**AI PRs:** Manually verified" yourself — ask the user whether they verified the changes before creating the PR, and leave it unchecked unless they confirm.

### 8. Return PR URL

```bash
open <PR_URL>
```

Display the PR URL to the user.

## Important Notes

- **Base branch is always `main`**. Firefly has no `release/*` family — `released` is a deployment branch, not a base for PRs.
- **Never commit to `main` or `released`** — always create a feature branch first.
- **Conventional commit format is enforced by CI** (`amannn/action-semantic-pull-request`).
- **Jira key (`FW-XXX`) in PR title is enforced by CI** (`DimensionDev/jira-issue-key-checker`). If the user has no Jira issue, this will block merge — surface that and ask whether to proceed without one or get a key first.
- **PR body must reflect conversation context.** A reviewer should be able to read it cold and understand why this change exists. Avoid generic descriptions.
- **All PR content in English** — title, body, branch name, commit messages.
- **No AI attribution lines** in commit messages or PR body (per Firefly project rules).
