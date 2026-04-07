# `@dimensiondev/scripts`

Private workspace package containing **CLI tooling, shell helpers, and small ESLint plugins** for the Firefly monorepo. Scripts resolve the **repository root** automatically (see `repo-root.cjs`), so run them from the monorepo root as usual, e.g. `node ./packages/scripts/<name>.mjs`, or via `pnpm`/`pnpm exec` from the root `package.json` scripts.

---

## Shared helper

| File                | Purpose                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`repo-root.cjs`** | Walks up from the caller until it finds `pnpm-lock.yaml` and `package.json`. Used by other scripts so paths stay correct when this package lives under `packages/scripts`. |

---

## Shell (GitHub Actions)

| Script                         | What it does                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **`.github/scripts/setup.sh`** | CI bootstrap: install global `pnpm`, `pnpm install`, `packages:build`, and Lingui compile. |

Vercel’s orchestrated build (**`setup.sh`**, **`build-logs.sh`**, **`build-polyfills.sh`**) and **`build-scripts.mjs`** live under **`apps/web/.vercel-config/`** (see that package’s `vercel.json` and `package.json` `build:*` scripts).

---

## Maintenance scripts (GitHub Actions)

These live under **`.github/scripts/`** (invoked from the repo root, e.g. `node .github/scripts/<name>.mjs`):

| Script                                              | What it does                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`.github/scripts/bump-packages-version.mjs`**     | Bumps **semver** (`major` \| `minor` \| `patch`) **per package** under **`packages/*`** from each package’s own version; stdout is the **highest** resulting version (for CI labels).                                                                          |
| **`.github/scripts/generate-package-analysis.mjs`** | Parses **`pnpm-lock.yaml`** and writes **`apps/web/docs/PACKAGE_ANALYSIS.txt`** and **`apps/wallet/docs/PACKAGE_ANALYSIS.txt`** (per-app direct deps + importers): package counts, multi-version packages, and short dependency-chain notes for indirect deps. |

---

## Dependencies & analysis

| Script                              | What it does                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| **`generate-package-analysis.mjs`** | Moved to **`.github/scripts/`**. Run via the `generate-package-analysis` workflow. |

---

## i18n (Lingui / Tolgee)

| Script                                              | What it does                                                                                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`regenerate-lingui-gettext-plural-metadata.cjs`** | Rebuilds **`lingui-gettext-plural-metadata.json`** from the English PO catalog and `src` (`<Trans id="…">` scan). Run after `lingui extract` when plural or explicit-id metadata changes. |
| **`restore-lingui-gettext-plural-metadata.cjs`**    | After **Tolgee pull**, re-applies plural ICU comments and explicit-id markers to locale **`messages.po`** files using the JSON metadata.                                                  |
| **`tolgee-push-sources.cjs`**                       | Wrapper around **`tolgee push`**: fixes PO files for `nplurals=1` locales so empty plural translations are not corrupted, then runs Tolgee with a temp config.                            |
| **`lingui-gettext-plural-metadata.json`**           | Generated data consumed by the restore/regenerate scripts (not hand-edited).                                                                                                              |

---

---

## ESLint plugins (local)

Local rule plugins live under the repo root **`rules/`** and are loaded from **`eslint.config.mjs`**, not from this package.

| Plugin (`rules/`)                          | What it does                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **`eslint-plugin-rename-jsx.mjs`**         | Rule **`rename-jsx-import`**: autofix imports that use **`.jsx`** in the path to **`.js`**.                    |
| **`eslint-plugin-use-client-newline.mjs`** | Rule **`require-newline-after-use-client`**: enforces a **blank line** after the **`"use client"`** directive. |

---

## See also

- **`apps/web/package.json`** wires **`build:scripts`**, **`build:logs`**, and **`build:polyfills`** to **`apps/web/.vercel-config/`**.
- A symlink **`apps/web/scripts` → `packages/scripts`** keeps a stable **`./scripts/...`** path for Tolgee/Lingui helpers and other tooling under this package; root callers use **`packages/scripts/`** directly.
