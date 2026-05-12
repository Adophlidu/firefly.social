---
name: pr-daily-report
description: Generate a 24-hour PR activity report for Firefly grouped by module, with English summaries. Use when the user asks for PR statistics, daily report, PR summary, or activity since yesterday.
disable-model-invocation: true
---

# 24h PR Daily Report

Generate a PR activity report for the last 24 hours, grouped by module, with English titles and status labels.

## Step 1: Fetch PR data

```bash
# macOS:
gh pr list --state all \
  --search "created:>=$(date -v-24H +%Y-%m-%dT%H:%M:%S)" \
  --limit 100 \
  --json number,title,state,isDraft,mergedAt,createdAt,author,labels

# Linux: use `date -d '24 hours ago'` instead of `date -v-24H`.
```

## Step 2: Classify status

- **[Done]**: state is `MERGED`
- **[WIP]**: state is `OPEN` (regardless of `isDraft`)
- **[Closed]**: state is `CLOSED` and `mergedAt` is null (skip from main grouping; note in footer)

## Step 3: Classify modules

Determine the module from the PR title prefix and content. Firefly's conventional-commit scopes and feature areas:

| Module          | Matching rules (case-insensitive substring on title)                          |
| --------------- | ----------------------------------------------------------------------------- |
| Wallet          | `wallet`, `account`, `signer`, `keyless`, `evm`, `solana`                     |
| Farcaster       | `farcaster`, `warpcast`, `frame`                                              |
| Lens            | `lens`                                                                        |
| Bluesky         | `bluesky`, `bsky`                                                             |
| Perps / Trading | `perps`, `trading`, `hyperliquid`, `position`, `market`, `kline`, `orderbook` |
| RN-UI           | `rn-ui`, `tamagui`                                                            |
| Web app         | `web`, `compose`, `feed`, `post`, `profile`, `notification`                   |
| Search          | `search`, `discover`                                                          |
| i18n / Tolgee   | `i18n`, `tolgee`, `lingui`, `translation`, `locale`                           |
| CI / Tooling    | `ci`, `workflow`, `eslint`, `typecheck`, `turbo`, `vite`, `next`              |
| Dependencies    | `bump`, `upgrade`, `dep`, `renovate`, `dependabot`                            |
| Docs            | `docs`, `readme`                                                              |

If a PR matches multiple, prefer the leftmost listed match (Wallet → Farcaster → … → Docs). If nothing matches, place it under **Other**.

## Step 4: Output format

Use this exact format:

```
## 24h PR Activity — YYYY-MM-DD

### {Module Name}
- #{number} {English title} [{status}]
- #{number} {English title} [{status}]

### {Module Name}
...

---

**Total: {total} PRs** — Done {merged} / WIP {open}
```

Rules:

- Keep each PR title concise (rewrite verbosely-prefixed titles for readability; preserve the FW-XXX Jira key if present).
- Group by module, each module is an `###` heading.
- Each PR is a `- #number title [status]` line.
- Modules with more PRs come first. Within a module, [Done] first, then [WIP].
- End with a summary line showing totals.
