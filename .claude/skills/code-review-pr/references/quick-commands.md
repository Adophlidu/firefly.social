# Quick Commands

Bash one-liners for automated PR review checks on Firefly. Run relevant ones based on triage.

## Diff & Scope

```bash
# Change summary
git diff origin/main...HEAD --stat

# Changed files list
git diff origin/main...HEAD --name-only

# Changed files with status (A/M/D)
git diff origin/main...HEAD --name-status
```

## Security & Secrets

```bash
# Potential secret/PII in diff
git diff origin/main...HEAD | grep -i -E "mnemonic|seed|private.?key|secret|password|token|apiKey|sessionToken"

# File upload without size validation
git diff origin/main...HEAD | grep -B5 -A10 "file\." | grep -v "size"
```

## Layer Hierarchy (Firefly-specific)

```bash
# In-app: store importing from hooks/components/modals (forbidden)
git diff origin/main...HEAD --name-only | grep -E '^apps/web/src/store/' | \
  xargs -I{} grep -Hn "from ['\"][@#]/\(hooks\|components\|modals\)" {} 2>/dev/null

# In-app: service or provider importing from a hook (forbidden)
git diff origin/main...HEAD --name-only | grep -E '^apps/web/src/(services|providers)/' | \
  xargs -I{} grep -Hn "from ['\"][@#]/hooks/" {} 2>/dev/null

# In-app: hook importing a component or modal (forbidden — use SingletonModal ref pattern)
git diff origin/main...HEAD --name-only | grep -E '^apps/web/src/hooks/' | \
  xargs -I{} grep -Hn "from ['\"][@#]/\(components\|modals\)" {} 2>/dev/null

# Workspace: Layer 1 package importing sibling Layer 1 (forbidden)
git diff origin/main...HEAD --name-only | grep -E '^packages/(hooks|web3|web3-utils|constants|envs|native-bridge|iframe-bridge|rn-ui)/' | \
  xargs -I{} grep -Hn "from ['\"]@dimensiondev/\(hooks\|web3\|web3-utils\|constants\|envs\|native-bridge\|iframe-bridge\|rn-ui\)" {} 2>/dev/null
```

## Firefly Restricted Patterns

```bash
# Relative imports (forbidden — use #/ alias)
git diff origin/main...HEAD | grep -E "^\+.*from ['\"]\.\.?/" | grep -v "node_modules"

# Direct next/image, next/link, next/navigation (forbidden — use #/esm/ shims)
git diff origin/main...HEAD | grep -E "^\+.*from ['\"]next/(image|link|navigation)['\"]"

# clsx / cx / template-literal class names (forbidden — use classNames)
git diff origin/main...HEAD | grep -E "^\+.*from ['\"](clsx|classnames)['\"]"
git diff origin/main...HEAD | grep -E "^\+.*className=\{\`"

# Missing .js extension on #/ imports
git diff origin/main...HEAD | grep -E "^\+.*from ['\"][@#]/[^'\"]+['\"]" | grep -v "\.js['\"]"

# 'use client' not on the first line of a client component
git diff origin/main...HEAD --name-only | grep -E '\.tsx?$' | \
  xargs -I{} sh -c "grep -l \"'use client'\" {} 2>/dev/null | xargs -I{} head -3 {}"

# Hardcoded user-visible strings (rough heuristic — JSX text not wrapped in <Trans> or t``)
git diff origin/main...HEAD | grep -E "^\+.*>[A-Z][a-zA-Z ]{4,}<" | grep -v "Trans\|formatMessage\|t\`"
```

## React Hooks

```bash
# useEffect with eslint-disable (potential dependency issues)
git diff origin/main...HEAD | grep -A5 "useEffect" | grep "eslint-disable"

# setState in async context (potential race condition)
git diff origin/main...HEAD | grep -B5 "setState\|set[A-Z]" | grep -E "then\(|await"

# Captured refs in cleanup (potential stale ref)
git diff origin/main...HEAD | grep -B10 "return.*=>" | grep "const.*=.*Ref.current"

# Missing memo() on non-trivial components
git diff origin/main...HEAD | grep -E "^\+export (default )?function [A-Z]" | head -5
```

## Performance

```bash
# Loops with await inside (sequential API calls)
git diff origin/main...HEAD | grep -E "for.*\{|forEach|\.map\(" -A10 | grep "await"

# map/forEach with index that mutates array
git diff origin/main...HEAD | grep -E "\.map\(|\.forEach\(" -A5 | grep -E "splice|shift|pop"
```

## Null Safety

```bash
# Missing optional chaining on refs
git diff origin/main...HEAD | grep -E "\.current\.[a-zA-Z]|ref\.[a-zA-Z]" | grep -v "?."

# Array index access without bounds check
git diff origin/main...HEAD | grep -E "\[index\]|\[i\]|\[0\]" -A2 | grep -v "if.*length\|if.*!"

# Division without zero guard
git diff origin/main...HEAD | grep -E "/ [a-zA-Z]" | grep -v "if.*===.*0\|if.*>.*0"
```

## Dependencies

```bash
# New/changed dependencies
git diff origin/main...HEAD -- '**/package.json' | grep -E '^\+.*"[^"]+": "[^"]+"'

# Check if new deps are deprecated
git diff origin/main...HEAD -- '**/package.json' | grep '^\+' | \
  grep -oE '"[^"]+": "[^"]+"' | cut -d'"' -f2 | \
  xargs -I{} sh -c 'npm view {} deprecated 2>/dev/null && echo "^^^ {}"'

# pnpm-specific: see why a package is installed
pnpm why PACKAGE_NAME
```

## Error Handling

```bash
# Silent catch blocks (catch without user feedback)
git diff origin/main...HEAD | grep -A3 "catch" | grep -v "Toast\|throw\|error\|Lingui\|Trans"

# Debounced functions missing promise return
git diff origin/main...HEAD | grep -E "debounce|setTimeout.*validate" -A5 | grep -v "Promise\|resolve"
```

## i18n (Lingui)

```bash
# Wrong macro import path (must be @lingui/react/macro or @lingui/core/macro)
git diff origin/main...HEAD | grep -E "^\+.*from ['\"]@lingui/macro['\"]"

# Hardcoded strings in JSX
git diff origin/main...HEAD --name-only | grep -E '\.tsx$' | \
  xargs grep -l '>[A-Z][a-zA-Z ]\{3,\}<' 2>/dev/null
```

## Build & CI

```bash
# CI workflow steps
grep -A2 "name:" .github/workflows/*.yml 2>/dev/null

# Conventional commit format on the PR title
gh pr view <PR_NUMBER> --json title --jq .title | grep -E '^(feat|fix|chore|refactor|docs|style|test|perf|ci|build|revert)(\(.+\))?: .+$'

# Jira issue key (FW-XXX) on the PR title
gh pr view <PR_NUMBER> --json title --jq .title | grep -E 'FW-[0-9]+'
```

## File Analysis

```bash
# Categorize changed files
git diff origin/main...HEAD --name-only | grep -E '\.(ts|tsx)$'      # Code
git diff origin/main...HEAD --name-only | grep -E '\.(json|ya?ml)$'  # Config
git diff origin/main...HEAD --name-only | grep -E '(\.test\.|\.spec\.|__tests__|tests/)' # Tests

# Security-critical file patterns
git diff origin/main...HEAD --name-only | grep -E "(auth|signer|wallet|session|secret|password|token|fireflySession)"

# By area
git diff origin/main...HEAD --name-only | grep '^apps/web/'
git diff origin/main...HEAD --name-only | grep '^apps/wallet/'
git diff origin/main...HEAD --name-only | grep '^packages/'
```
