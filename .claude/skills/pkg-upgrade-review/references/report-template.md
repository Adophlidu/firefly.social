# Report Template

Use this template when generating package upgrade review reports.

## File Naming

```
node_modules/.cache/pkg-upgrade/<package-name>-<old-version>-to-<new-version>.md
```

Examples:

- `@isaacs-brace-expansion-5.0.0-to-5.0.1.md`
- `minimatch-9.0.3-to-10.0.0.md`
- `tamagui-1.114.0-to-1.115.0.md`

Use `-` to replace `/` and `@` scope separators in package names.

## Template

````markdown
# <PACKAGE_NAME> <OLD_VERSION> → <NEW_VERSION> Upgrade Analysis

> PR: <PR_URL>
> Generated: <DATE>

---

## 1. Code Diff

### 1.1 New Exports

```javascript
// List new exports (constants, functions, types)
```

### 1.2 Removed Exports

```javascript
// List removed exports (if any) — HIGH RISK
```

### 1.3 Function Signature Changes

```diff
- // Old signature
+ // New signature
```

Explain what changed: new params, removed params, type changes.

### 1.4 Core Behavior Changes

Describe behavioral changes with diff snippets for each change point.

```diff
- // Old behavior
+ // New behavior
```

### 1.5 Full diff

Include the full diff of the main source file(s) for reference.

```diff
// Full diff output
```

### 1.6 Other Changes

| File           | Change                          |
| -------------- | ------------------------------- |
| `package.json` | Description of metadata changes |
| `README.md`    | Description of doc changes      |

### 1.7 Security Implications

Describe any security implications (CVE fixes, DoS prevention, input validation, etc.).

---

## 2. Call Sites in the Project

### 2.1 Project Source

State whether direct imports exist. If yes, list each file and line with the relevant code.

### 2.2 Indirect Callers in node_modules

For each caller found in node_modules:

#### Caller N: <CALLER_PACKAGE>

- **File**: `node_modules/<path>:<line>`
- **<CALLER> version**: X.Y.Z
- **Dependency spec**: `"PACKAGE": "^X.Y.Z"`

```javascript
// The actual call site code
```

**Purpose**: What this caller uses the package for.

### 2.3 Call Site Summary

| Caller  | Call code         | Arg count | Uses new API? |
| ------- | ----------------- | --------- | ------------- |
| caller1 | `expand(pattern)` | 1         | No            |

### 2.4 Install Locations

| Location                    | Version      | Notes            |
| --------------------------- | ------------ | ---------------- |
| Root `node_modules/PACKAGE` | X.Y.Z        | hoisted / nested |
| `apps/web/node_modules/`    | X.Y.Z or N/A | notes            |
| `apps/wallet/node_modules/` | X.Y.Z or N/A | notes            |

---

## 3. Compatibility Assessment

| Change             | <OLD_VERSION> | <NEW_VERSION> | Compatibility                    |
| ------------------ | ------------- | ------------- | -------------------------------- |
| Function signature | `fn(a)`       | `fn(a, b?)`   | Fully compatible / Needs changes |
| Return type        | `string[]`    | `string[]`    | Unchanged / Changed              |
| Return content     | description   | description   | No impact / Needs evaluation     |
| New export         | None          | `CONST_NAME`  | Does not affect existing code    |
| Removed export     | `oldFn`       | None          | Breaking change                  |

### Return Value Truncation / Behavior Risk

Describe any scenarios where return value changes could affect callers.

**Verdict: [Safe to merge / Has risk], [Recommend merge / Needs changes / Recommend reject].**
````

## Risk Level Guidelines

Use these criteria to determine the verdict:

### Safe to merge

- Patch version bump
- Only new optional parameters added
- Return type unchanged
- No direct usage in project source
- All indirect callers compatible

### Merge with changes

- Minor version bump with new features used by callers
- Return content changed but callers can handle it
- Some call sites need updating

### Reject / needs discussion

- Major version bump with breaking changes
- Removed exports used by callers
- Return type changed and callers depend on old type
- Package deprecated without migration path
- Security concerns with new version

## Posting to PR (REQUIRED)

After generating the local report file, the full report MUST be posted as a PR comment.

```bash
# Post the full report as a PR comment
gh pr comment PR_NUMBER --body "$(cat node_modules/.cache/pkg-upgrade/REPORT_FILE.md)"
```

If the report exceeds GitHub's comment length limit (~65,536 chars), split into multiple comments:

```bash
# Comment 1: Code diff and call sites
gh pr comment PR_NUMBER --body "$(cat <<'EOF'
# PACKAGE OLD → NEW Upgrade Analysis (1/2)

## 1. Code Diff
...

## 2. Call Sites
...
EOF
)"

# Comment 2: Compatibility assessment
gh pr comment PR_NUMBER --body "$(cat <<'EOF'
# PACKAGE OLD → NEW Upgrade Analysis (2/2)

## 3. Compatibility Assessment
...
EOF
)"
```
