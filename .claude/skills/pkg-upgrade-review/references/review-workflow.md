# Package Upgrade Review Workflow

Detailed step-by-step process for reviewing package version upgrades in Firefly.

## Prerequisites

- PR or branch with lockfile changes available
- `npm` CLI available for querying registry metadata
- `pnpm` for resolving installed versions

## Step 1: Identify Upgrade Scope

Extract the package name and version range from the lockfile diff.

```bash
# Get the lockfile diff
git diff origin/main...HEAD -- '**/pnpm-lock.yaml'

# Example lines to parse:
#   -  /pkg@5.0.0
#   +  /pkg@5.0.1
```

Record:

- **Package name**: e.g. `@isaacs/brace-expansion`
- **Old version**: e.g. `5.0.0`
- **New version**: e.g. `5.0.1`
- **Semver level**: major / minor / patch

## Step 2: Check Package Metadata

```bash
# Check if the new version is deprecated
npm view PACKAGE@NEW_VERSION deprecated

# Check integrity hash
npm view PACKAGE@NEW_VERSION dist.integrity

# Check dependencies changed
npm view PACKAGE@OLD_VERSION dependencies --json
npm view PACKAGE@NEW_VERSION dependencies --json

# Check package author/maintainer + deprecation status
npm view PACKAGE@NEW_VERSION --json | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('name:', d.get('name'))
print('version:', d.get('version'))
print('deprecated:', d.get('deprecated', 'No'))
print('dependencies:', json.dumps(d.get('dependencies', {}), indent=2))
"
```

Verify:

- [ ] Package is NOT deprecated
- [ ] Package author is trusted / well-known
- [ ] Dependency list has not changed unexpectedly (no new transitive deps)

## Step 3: Download and Diff Source Code

```bash
# Create temp directory and download both versions
mkdir -p /tmp/pkg-diff && cd /tmp/pkg-diff
rm -rf old new && mkdir old new

curl -sL $(npm view PACKAGE@OLD_VERSION dist.tarball) | tar xz -C old
curl -sL $(npm view PACKAGE@NEW_VERSION dist.tarball) | tar xz -C new

# Compare file lists (find added/removed files)
diff -rq old/package new/package

# Diff main source files (adjust path based on package structure)
diff old/package/dist/commonjs/index.js new/package/dist/commonjs/index.js
diff old/package/dist/esm/index.js new/package/dist/esm/index.js

# Diff type definitions
diff old/package/dist/commonjs/index.d.ts new/package/dist/commonjs/index.d.ts

# Diff package.json (dependencies, scripts, exports)
diff old/package/package.json new/package/package.json
```

### Source paths vary by package structure

Common layouts to check:

| Structure         | Source paths                                  |
| ----------------- | --------------------------------------------- |
| Standard CJS/ESM  | `dist/commonjs/index.js`, `dist/esm/index.js` |
| Single file       | `index.js` or `lib/index.js`                  |
| TypeScript source | `src/index.ts` (if published)                 |
| Bundled           | `dist/index.js`, `dist/index.mjs`             |

Always run `diff -rq old/package new/package` first to understand the structure.

### Classify Each Change

For every diff found, classify it into one of these categories:

| Category                        | Risk   | Description                                             |
| ------------------------------- | ------ | ------------------------------------------------------- |
| **API signature change**        | High   | Function parameters added/removed/reordered             |
| **Return value type change**    | High   | Return type changed (e.g. `string` → `object`)          |
| **Return value content change** | Medium | Same type but different content (e.g. capped results)   |
| **New export**                  | Low    | New function/constant/type exported                     |
| **Removed export**              | High   | Previously exported symbol removed                      |
| **Behavior change**             | Medium | Same API but different internal behavior                |
| **Dev/build only**              | None   | Changes to package.json scripts, prettier config, tests |

## Step 4: Search Project Source Code

Search for direct usage of the package in the monorepo source (excluding `node_modules`, `dist`, `.next`):

```bash
# Direct imports across apps + packages
grep -r "PACKAGE_NAME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  -l apps packages \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next

# Also search for common re-export patterns
grep -r "from.*PACKAGE_NAME\|require.*PACKAGE_NAME" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  -n apps packages \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next

# Check if it's a direct dependency in any package.json
grep -r "PACKAGE_NAME" --include="package.json" -l . \
  --exclude-dir=.git --exclude-dir=node_modules
```

## Step 5: Search node_modules for Indirect Usage

Packages are often consumed indirectly through intermediate libraries:

```bash
# Find all files that import this package
grep -rn "from ['\"]PACKAGE_NAME['\"]" node_modules/ \
  --include="*.js" --include="*.mjs" --include="*.cjs" \
  | grep -v "node_modules/.cache" | head -50

# Find require() calls
grep -rn "require.*PACKAGE_NAME" node_modules/ \
  --include="*.js" --include="*.cjs" \
  | grep -v "node_modules/.cache" | head -50
```

For each caller found:

1. Read the call site to see which functions are used
2. Check what arguments are passed
3. Verify the caller's version and its own dependency range for the package

```bash
# Example: check the intermediate package version and its dependency spec
cat node_modules/CALLER_PKG/package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('name:', d.get('name'))
print('version:', d.get('version'))
deps = d.get('dependencies', {})
print('dep on PACKAGE:', deps.get('PACKAGE_NAME', 'N/A'))
"
```

## Step 6: Trace Each Call Site

For every call site found (direct or indirect), verify compatibility:

### Checklist per call site

- [ ] **Arguments match**: caller passes N args, new signature accepts N args
- [ ] **Optional params**: new optional params have safe defaults
- [ ] **Return type**: caller expects the same return type
- [ ] **Return content**: caller handles potential content changes (e.g. truncation)
- [ ] **Removed APIs**: caller does not use any removed exports
- [ ] **New behavior**: caller is not sensitive to behavioral changes

## Step 7: Check Installation Locations

Understand which lockfile is affected and where the package is actually resolved. pnpm hoists to the root `node_modules`, but workspaces can pin their own copies.

```bash
# Find all installed copies of the package
find node_modules -path "*PACKAGE_NAME/package.json" -maxdepth 6 2>/dev/null | \
  while read f; do
    echo "$f: $(python3 -c "import json; print(json.load(open('$f'))['version'])")"
  done

# Check if specific apps have their own pinned copy
ls apps/web/node_modules/PACKAGE_NAME/package.json 2>/dev/null
ls apps/wallet/node_modules/PACKAGE_NAME/package.json 2>/dev/null

# pnpm-specific: inspect the resolution tree
pnpm why PACKAGE_NAME
```

`pnpm why` is the most reliable way to see why a package is installed and which workspaces depend on it.

## Step 8: Assess Overall Risk

Combine findings into a risk matrix:

| Factor         | Low Risk                 | Medium Risk              | High Risk                 |
| -------------- | ------------------------ | ------------------------ | ------------------------- |
| Semver level   | Patch (x.y.Z)            | Minor (x.Y.0)            | Major (X.0.0)             |
| API changes    | New optional params only | New required params      | Removed/renamed APIs      |
| Return value   | Identical                | Same type, capped        | Different type            |
| Direct usage   | None in project          | Few call sites           | Many call sites           |
| Indirect usage | Callers use basic API    | Callers use advanced API | Callers rely on internals |
| Deprecated     | Not deprecated           | Successor announced      | Deprecated with CVE       |

## Step 9: Generate Report

Save the structured report following the template in [report-template.md](report-template.md).

Output path: `node_modules/.cache/pkg-upgrade/<package-name>-<old>-to-<new>.md`

```bash
mkdir -p node_modules/.cache/pkg-upgrade
# Write report using the Write tool
```

## Step 10: Post Report to PR Comment (REQUIRED)

The full report MUST be posted as a comment on the PR.

```bash
# Post the full report as a PR comment
gh pr comment PR_NUMBER --body "$(cat node_modules/.cache/pkg-upgrade/REPORT_FILE.md)"
```

If the report exceeds GitHub's comment length limit (~65,536 chars), split into key sections:

1. First comment: Sections 1 (code diff) and 2 (call sites)
2. Second comment: Section 3 (compatibility assessment)
