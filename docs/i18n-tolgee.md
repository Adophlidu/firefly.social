# Tolgee (self-hosted)

Translations are edited in [Tolgee](https://i18n.firefly.land/) and synced with this repo via [`@tolgee/cli`](https://docs.tolgee.io/tolgee-cli). The app keeps using [Lingui](https://lingui.dev/); only the Crowdin sync tooling was replaced.

## GitHub Actions

Configure repository secrets:

| Secret              | Purpose                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `TOLGEE_API_KEY`    | [Project API key](https://docs.tolgee.io/platform/account_settings/api_keys_and_pat_tokens) (recommended) or Personal Access Token |
| `TOLGEE_PROJECT_ID` | Numeric project id — required **only** with a PAT (embedded in most project keys)                                                  |

Remove obsolete `CROWDIN_*` secrets when the migration is done.

## Tolgee project

1. Create a project on the self-hosted instance.
2. Add languages to match real locales in `lingui.config.js`: `en` (base), `ko`, `ja`, `zh-Hans`, `zh-Hant`. The `pseudo` locale is Lingui-only for UI testing and is **not** uploaded; keep `push.files` in `.tolgeerc.json` in sync with Tolgee language tags if your project uses different codes (e.g. `zh_CN`).
3. **Initial content**: either import existing `.po` files from the repo / an export from Crowdin, or run locally (with auth):

    ```bash
    pnpm tolgee:push
    ```

## Local commands

| Script                     | Behavior                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm tolgee:push-sources` | Upload production locales listed in `.tolgeerc.json` `push.files` (same as CI; excludes `pseudo`). |
| `pnpm tolgee:pull`         | Download all locales into `src/locales/*/messages.po`.                                             |
| `pnpm tolgee:sync`         | `tolgee pull`, then `lingui:extract` (sort / merge from source), then `lingui:compile` — same order as the download Action. |

The **Tolgee download** GitHub Action runs `tolgee pull`, then `pnpm run lingui:extract`, then `lingui:compile`. Extract reapplies `lingui.config.js` sort order (`orderBy: 'message'`) and merges strings from the codebase so automated PRs stay consistent with local `pnpm lingui`.

Authenticate once with `pnpm exec tolgee login` (CLI stores credentials; use `--api-url` if not using `.tolgeerc.json`).

Configuration lives in `.tolgeerc.json` (`apiUrl`, `PO_ICU`, paths).

`pull.states` includes `UNTRANSLATED` so exported `.po` files keep every key per locale (empty `msgstr` where there is no translation). The Tolgee CLI default is to omit untranslated rows, which made diffs look like keys were removed.

### Lingui extract vs Tolgee pull (sort order)

`lingui.config.js` uses `orderBy: 'message'` so catalogs are sorted by **source string** (`msgid` text), close to Tolgee’s PO ordering. The download job runs **`lingui:extract` after `tolgee pull`** so committed files match that order and match local `pnpm lingui`.

If non-English POs should stay Tolgee-owned only, you can run `pnpm exec lingui extract --clean --locale en` before pushing source to Tolgee (advanced).

## Optional: in-context / runtime SDK

The [JavaScript SDK](https://docs.tolgee.io/js-sdk) is not required for Lingui + CLI. Add it only if you want in-context editing in the app.
