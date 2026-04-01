# `@dimensiondev/scripts`

Private workspace package containing **CLI tooling, shell helpers, and small ESLint plugins** for the Firefly monorepo. Scripts resolve the **repository root** automatically (see `repo-root.cjs`), so run them from the monorepo root as usual, e.g. `node ./scripts/<name>.mjs`, or via `pnpm`/`pnpm exec` from the root `package.json` scripts.

---

## Shared helper

| File                | Purpose                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`repo-root.cjs`** | Walks up from the caller until it finds `pnpm-lock.yaml` and `package.json`. Used by other scripts so paths stay correct when this package lives under `packages/scripts`. |

---

## Shell

| Script                    | What it does                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`setup-vercel.sh`**     | Full build path aimed at Vercel: Lingui compile, sequential `packages/*` builds, polyfills, bundled scripts, build logs, then the main Next.js `build`.                                  |
| **`setup-gh-actions.sh`** | CI bootstrap: install global `pnpm`, `pnpm install`, `packages:build`, and Lingui compile.                                                                                               |
| **`build-logs.sh`**       | Writes **`public/next-debug.log`** with git commit/branch/tag, app version, Node/pnpm versions, timestamps, and Vercel env — useful for debugging and version visibility in deployments. |
| **`build-polyfills.sh`**  | Runs Rollup on `src/polyfills` to produce the browser polyfill bundle (see root `package.json` / `build:polyfills`).                                                                     |

---

## Build & bundles

| Script                          | What it does                                                                                                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`build-scripts.mjs`**         | **esbuild** bundles: service workers, Firebase messaging SW, vendored `twitter-api-v2` prebuilt, `home-redirect` script; writes **Chrome DevTools** `com.chrome.devtools.json` with the workspace root. Loads env from **`.env.local`** at repo root. |
| **`bump-packages-version.mjs`** | Bumps **semver** (`major` \| `minor` \| `patch`) **per package** under **`packages/*`** from each package’s own version; stdout is the **highest** resulting version (for CI labels).                                                                 |

---

## Dependencies & analysis

| Script                              | What it does                                                                                                                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`audit-unused-deps.mjs`**         | Compares root **`package.json`** dependencies to imports and config usage under `src/` and `packages/scripts`, then writes **`unused-dependencies-report.json`**. Uses allowlists for tooling-only deps.                            |
| **`filter-ts-prune.mjs`**           | Reads a **`ts-prune`** log (default: `ts-prune.log` at repo root), drops lines that match file/path whitelist rules, writes **`ts-prune-filtered.log`**. Explicit paths are resolved from **cwd**; defaults are repo-root-relative. |
| **`generate-package-analysis.mjs`** | Parses **`pnpm-lock.yaml`** and emits **`docs/PACKAGE_ANALYSIS.txt`**: package counts, multi-version packages, and short dependency-chain notes for indirect deps.                                                                  |

---

## i18n (Lingui / Tolgee)

| Script                                              | What it does                                                                                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`regenerate-lingui-gettext-plural-metadata.cjs`** | Rebuilds **`lingui-gettext-plural-metadata.json`** from the English PO catalog and `src` (`<Trans id="…">` scan). Run after `lingui extract` when plural or explicit-id metadata changes. |
| **`restore-lingui-gettext-plural-metadata.cjs`**    | After **Tolgee pull**, re-applies plural ICU comments and explicit-id markers to locale **`messages.po`** files using the JSON metadata.                                                  |
| **`tolgee-push-sources.cjs`**                       | Wrapper around **`tolgee push`**: fixes PO files for `nplurals=1` locales so empty plural translations are not corrupted, then runs Tolgee with a temp config.                            |
| **`lingui-gettext-plural-metadata.json`**           | Generated data consumed by the restore/regenerate scripts (not hand-edited).                                                                                                              |

---

## Jira

| Script                               | What it does                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`create-jira-issue.mjs`**          | Creates a Jira issue via REST API (title, description, labels, project, etc.). Expects **`JIRA_*`** vars (e.g. from **`.env.local`** at repo root). |
| **`update-jira-issue.mjs`**          | Updates an existing Jira issue’s description (and related fields supported by the script).                                                          |
| **`create-jira-from-exception.mjs`** | Pulls an exception from **firefly-exception-tracker**, formats it from the team template, and opens a Jira issue with the right tags.               |

---

## ESLint plugins (local)

These are **local ESLint plugins** referenced from the repo ESLint config, not standalone CLIs.

| Plugin                                     | What it does                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **`eslint-plugin-rename-jsx.mjs`**         | Rule **`rename-jsx-import`**: autofix imports that use **`.jsx`** in the path to **`.js`**.                    |
| **`eslint-plugin-use-client-newline.mjs`** | Rule **`require-newline-after-use-client`**: enforces a **blank line** after the **`"use client"`** directive. |

---

## See also

- Root **`package.json`** `scripts` entries wire many of these (e.g. `build:scripts`, `build:logs`, Lingui/Tolgee commands).
- A symlink **`scripts` → `packages/scripts`** at the repo root keeps `node ./scripts/...` paths stable.
