---
name: monitor-pr-ci
description: Monitors a Firefly PR's CI checks and review comments until all pass and issues are resolved. Auto-fixes CI failures (typecheck, eslint, vitest, cspell), addresses inline review comments, replies, and resolves threads. Use when watching CI status, waiting for checks to pass, fixing CI errors, or resolving review feedback on a pull request.
disable-model-invocation: true
argument-hint: '<PR number or URL> [polling interval]'
---

# Monitor Firefly PR CI & Reviews

Monitor a pull request's CI checks and review comments. Auto-fix CI failures, address inline review comments, reply to reviewers, and resolve threads.

## Usage

```
/monitor-pr-ci https://github.com/DimensionDev/firefly.mask.social/pull/8601 3m
/monitor-pr-ci 8601 5m
/monitor-pr-ci https://github.com/DimensionDev/firefly.mask.social/pull/8601
/monitor-pr-ci 8601
/monitor-pr-ci
```

## Input

`$ARGUMENTS` — two parts, space-separated:

1. **PR identifier** (required if no PR exists for the current branch): PR number or full GitHub URL.
2. **Polling interval** (optional, default `6m`): e.g. `30s`, `1m`, `2m`, `3m`, `5min`, `6m`.

If `$ARGUMENTS` is empty, auto-detect the PR from the current branch and use the default 6m interval.

## Step 0: Initial Setup

1. **Parse arguments**: Split `$ARGUMENTS` into PR identifier and polling interval.
    - PR identifier: a number, or a URL like `https://github.com/{owner}/{repo}/pull/{number}`.
    - Polling interval: any token matching a time pattern (digits + unit). Recognize: `s`/`sec`, `m`/`min`. Default: `6m`.
    - If `$ARGUMENTS` is empty, detect PR from current branch:
        ```bash
        gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'
        ```
    - If no PR found and no argument provided, ask the user for the PR link.

2. **Resolve owner/repo**:
    - If a full GitHub URL was provided, extract owner and repo from it.
    - Otherwise, detect from local repo:
        ```bash
        gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"'
        ```

3. **Confirm and start** (no further questions needed):
    ```
    Monitoring PR #8601 (DimensionDev/firefly.mask.social)
    Polling interval: 3m
    Starting...
    ```

## Step 1: Poll Loop

Each iteration is labelled `[Check N/30]`.

### 1a. Fetch ALL data — EVERY iteration

**CRITICAL: You MUST run ALL FOUR queries in parallel on EVERY iteration.** Skipping query 3 or 4 on later iterations causes new review comments to be silently ignored. Do NOT skip any query even if the previous iteration had no threads.

```bash
# 1. CI check status
gh pr checks <PR_NUMBER> --json bucket,name,state,link,startedAt,completedAt,workflow

# 2. PR-level reviews and general comments
gh pr view <PR_NUMBER> --json state,reviews,comments,reviewDecision,url

# 3. Inline review comments (file:line annotations)
gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments \
  --jq '.[] | {user: .user.login, body: .body, path: .path, line: .original_line, created_at: .created_at}'

# 4. Unresolved review threads (GraphQL — provides thread IDs for resolving)
gh api graphql -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      id
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          diffSide
          comments(first: 20) {
            nodes {
              id
              databaseId
              body
              author { login }
              createdAt
            }
          }
        }
      }
    }
  }
}' -f owner="OWNER" -f repo="REPO" -F pr=PR_NUMBER
```

> **Why all four?** `gh pr checks` only returns CI status. `gh pr view --json reviews` returns PR-level reviews but NOT inline file comments. `gh api .../pulls/.../comments` is the ONLY way to get inline code review comments. The GraphQL query is the ONLY way to get thread IDs and resolution status. New comments can arrive at ANY time, so you MUST check on every iteration.

**GraphQL fallback**: If GraphQL fails (e.g. token permission issues), fall back to REST for inline comments:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --jq '.[] | {id: .id, body: .body, path: .path, line: .original_line, user: .user.login, in_reply_to_id: .in_reply_to_id, created_at: .created_at}'
```

> **Note**: REST fallback can fetch and reply to comments but **cannot resolve threads** (GitHub only supports this via GraphQL). When using REST fallback, skip the resolve step (Step 3d) and log a warning that threads must be resolved manually.

Filter to only **unresolved** threads (`isResolved: false`). Skip threads where the last comment is from the current `gh` user (already replied).

### 1b. Display status summary

```
[Check 3/30]

CI Status:
| Check       | Status  | Duration |
|-------------|---------|----------|
| typecheck   | pass    | 2m04s    |
| eslint      | pending | -        |
| test        | pass    | 1m12s    |
| spellcheck  | pass    | 0m18s    |
| validate    | pass    | 0m02s    |
| publish     | pass    | 0m02s    |

Unresolved threads: 3
- apps/web/src/components/Foo.tsx:42 (@reviewer): "Consider memoizing this"
- packages/utils/src/format.ts:15 (@reviewer): "This should handle null case"
- apps/wallet/src/store/bar.ts:88 (@reviewer): "Layer violation — store imports hook"
```

### 1c. Decide next action

Classify the `gh pr checks` output into three buckets:

- **Failed checks**: any check in state `FAILURE`, `ERROR`, `CANCELLED`, `TIMED_OUT`
- **Pending checks**: any check still pending or in progress
- **Passed checks**: state `SUCCESS`

Firefly CI check names and the workflow file each belongs to:

| Check name   | Workflow                                        | Auto-fix entry point                                       |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------- |
| `typecheck`  | `.github/workflows/typecheck.yml`               | `pnpm typecheck`                                           |
| `eslint`     | `.github/workflows/eslint.yml`                  | Scoped `eslint --fix` on PR-changed files (see Step 2)     |
| `test`       | `.github/workflows/test.yaml`                   | `pnpm test`                                                |
| `spellcheck` | `.github/workflows/cspell.yml`                  | Add new words to `cspell.json`                             |
| `validate`   | `.github/workflows/conventional-commits.yml`    | Fix PR title to conventional format                        |
| `publish`    | `.github/workflows/jira-issue-key-checking.yml` | Add `FW-XXX` to PR title                                   |

| CI Status         | Unresolved Threads | Action                                            |
| ----------------- | ------------------ | ------------------------------------------------- |
| Has failed checks | —                  | **Auto-fix** CI failure (Step 2)                  |
| Any pending       | Has threads        | **Address threads** (Step 3), keep waiting for CI |
| Any pending       | No threads         | Wait, re-check                                    |
| All pass          | Has threads        | **Address threads** (Step 3)                      |
| All pass          | No threads         | **Done** (Step 4)                                 |

## Step 2: Auto-fix CI Failures

For each failed check:

1. Identify the actionable failed check from the latest poll result.
    - Preserve the failed check's `name` and `link`.
    - A rerun can expose a different failure later in the same check after an earlier error is fixed. Treat each new failed-check result as a new Step 2 item until no failed checks remain.

2. Derive `RUN_ID` from the failed check `link`.
    - Example link: `https://github.com/{owner}/{repo}/actions/runs/<RUN_ID>/job/<JOB_ID>`
    - Extract `<RUN_ID>` from the URL and use that exact run when fetching logs.

3. Get failure log:

    ```bash
    gh run view <RUN_ID> --log-failed 2>&1 | tail -200
    ```

4. Analyze the failure and determine the cause.

5. **Fixable** — apply the routing table above:
    - **`typecheck` failures**: Re-run `pnpm typecheck` locally to see errors faster than parsing the log. Fix type errors at their source. Common causes: missing `.js` extension on `@/` imports, layer-rule violations surfaced by type-only imports.
    - **`eslint` failures**: Auto-fix **only the files this PR changed** — never repo-wide, or unrelated files get swept into the PR's commits:

        ```bash
        git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' \
          | xargs -r npx eslint --fix
        ```

        If unfixable, read the violation and fix manually. Common Firefly issues:
        - `no-relative-import-paths` — replace `../` with `@/`
        - layer-rule violations (custom rules `eslint-import-architecture-zones`, `eslint-package-layer-boundaries`) — see `/architecture`
        - direct `next/image` / `next/link` imports — switch to `@/esm/Image.js` etc.
        - `clsx` / template-literal class names — switch to `classNames` from `@dimensiondev/utils`
    - **`test` failures**: Run `pnpm test` locally. Fix tests at their source, not by changing the expectations.
    - **`spellcheck` failures**: Add the unknown word(s) to `cspell.json` if legitimate, otherwise fix the spelling.
    - **`validate` failures** (conventional commits): Update the PR title to `type(scope): description` format via `gh pr edit <PR> --title "..."`.
    - **`publish` failures** (Jira key missing): Append `FW-XXX` to the PR title. If no Jira issue exists, ask the user before proceeding.

    After fixing:
    - Commit: `fix: resolve CI <check-name> failure`
    - Push to the PR branch
    - Wait 30s, return to Step 1

6. **Potentially unrelated or pre-existing** — if the failure exists on `origin/main`:
    - Verify by checking out `origin/main` or grepping for the failing condition outside the PR diff.
    - Report it as a pre-existing blocker.
    - Ask the user whether to fix it in this PR or treat it as out of scope.

7. **Not fixable** (infra issue, flaky test, unrelated failure the user doesn't want fixed here):
    - Report failure details to the user.
    - Suggest actions (re-run, skip, manual fix).
    - Ask how to proceed.

## Step 3: Address Review Threads

For each unresolved thread:

### 3a. Categorize the comment

Read the comment body and the relevant code context. Categorize:

- **Code fix needed** — requires file modification → **auto-fix**
- **Question** — requires explanation only, no code change → **auto-reply**
- **Disagree / won't fix** — **MUST ask user** before responding. Never auto-resolve disagreements.

Display a one-line log per thread of what will be done, then proceed to fix immediately. Do NOT wait for user confirmation — only pause for disagree/won't-fix cases.

### 3b. Fix the code

For each thread that needs a code fix:

1. Read the file at the specified path and line.
2. Make the fix using the Edit tool.
3. Verify the fix doesn't break lint/types if quick to check.

### 3c. Reply to the comment

```bash
gh api --method POST \
  repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_database_id}/replies \
  -f body='Fixed: [concise explanation of the change]'
```

For questions (no code change needed):

```bash
gh api --method POST \
  repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_database_id}/replies \
  -f body='[answer to the question]'
```

Keep replies concise. Explain **what** was changed and **why**.

### 3d. Resolve the thread

After replying, resolve the thread via GraphQL:

```bash
gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}' -f threadId="THREAD_NODE_ID"
```

> **Note**: Resolve thread requires GraphQL. If Step 1a fell back to REST, skip this step and log: "Thread resolve skipped (GraphQL unavailable). Please resolve manually."

### 3e. Commit and push

After all threads are addressed in this iteration:

1. Stage changed files: `git add <specific files>`
2. Commit:

    ```bash
    git commit -m "fix: address PR review feedback

    - [list each fix made]"
    ```

3. Push: `git push`

### 3f. Request re-review

After pushing fixes, request re-review from the reviewers who left comments:

```bash
gh pr edit <PR_NUMBER> --add-reviewer <reviewer1>,<reviewer2>
```

Or via API if `--add-reviewer` doesn't trigger re-review:

```bash
gh api --method POST \
  repos/{owner}/{repo}/pulls/{pr_number}/requested_reviewers \
  -f 'reviewers[]=reviewer1' -f 'reviewers[]=reviewer2'
```

Return to Step 1 (wait for CI to re-run).

## Step 4: Final Report

When all CI checks pass and no unresolved threads remain:

```
All CI checks passed. All review threads resolved.

CI:
| Check       | Status | Duration |
|-------------|--------|----------|
| typecheck   | pass   | 2m04s    |
| eslint      | pass   | 1m45s    |
| test        | pass   | 1m12s    |
| spellcheck  | pass   | 0m18s    |
| validate    | pass   | 0m02s    |
| publish     | pass   | 0m02s    |

Review threads: 5 resolved, 0 remaining
PR: <URL>
Status: Ready for re-review / Ready to merge
```

## Polling Rules

- Default **6 minutes** between checks (user can customize in Step 0).
- **30 seconds** after fix+push to allow CI restart.
- **Maximum 30 iterations**, then ask the user whether to continue or stop.
- Always show `[Check N/30]`.
- **Waiting between polls**: foreground `sleep` is blocked by the harness. Wait with a background
  command (`Bash` with `run_in_background: true` running `sleep <seconds>` — you're re-invoked when it
  exits) or the `Monitor` tool with an until-loop, then run the next iteration.

## Important Notes

- CI failures: auto-fix without asking.
- Do not stop after fixing the first CI error if the rerun exposes another failed check later. Continue Step 2 on every new failed-check result until all CI checks pass.
- Review comments: **auto-fix without asking** — display a brief summary of what will be done, then proceed immediately.
- **Disagree / won't fix**: ALWAYS ask the user before replying or resolving — this is the ONLY case that requires user input.
- Never force-push or amend commits.
- Each fix round is a new commit.
- Fix multiple CI failures in one commit when possible.
- Do NOT re-run checks automatically (only if user requests `gh run rerun`).
- Do NOT include `Co-Authored-By` or AI-generated attribution in commit messages.
- Track which threads have been addressed to avoid duplicate work across iterations.

## Error Handling

- **Non-blocking errors**: If any individual step fails (resolve thread, reply to comment, request re-review), log a warning and continue with the next thread/step. Never abort the entire loop due to a single thread failure.
- **GraphQL unavailable**: Fall back to REST API for fetching comments. Skip resolve step, log a warning.
- **Reply fails**: Log warning with thread path/line, continue to next thread. The code fix is still committed.
- **Resolve fails**: Log warning, continue. The thread stays open but the fix is pushed.
- **Re-review request fails**: Log warning, continue. The reviewer can still see the push notification.
- **Blocking errors**: Abort the loop if:
    - `gh` CLI is not authenticated.
    - The PR does not exist.
    - The PR is already closed or merged (check via `gh pr view <PR_NUMBER> --json state --jq '.state'` each iteration — if `CLOSED` or `MERGED`, stop and inform the user).
