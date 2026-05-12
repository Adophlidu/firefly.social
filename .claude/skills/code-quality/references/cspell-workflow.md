# cspell Workflow — Firefly

How to handle cspell errors when running `npx cspell --no-progress "**/*"` (which is what CI runs).

## Where words live

Firefly stores accepted words in a single file: **`cspell.json` at the repo root**, in the `words` array.

```json
{
    "version": "0.2",
    "language": "en",
    "words": ["algorand", "appkit", "aptos", "..."]
}
```

Unlike OneKey (which uses a separate `.txt` file), firefly keeps everything in this JSON. There is no separate "skip list" file.

## When to add a word

A word goes in `cspell.json` only if **at least one** is true:

1. It's a **real technical term** — chain name (`arbitrum`, `solana`), protocol (`farcaster`, `lens`, `bluesky`, `atproto`), library (`tamagui`, `lingui`, `radix`, `tsgo`), brand (`firefly`).
2. It's a **vendor field / API name** you don't control (e.g. `displayName` is fine for English, but a non-English API field stays as-is and goes in cspell).
3. It's a **commit-message-only term** that cspell catches via the commit-message check (rare).

If none of these apply, **fix the typo instead**. Don't pollute the list with one-off misspellings.

## Add-word workflow

```bash
# 1. Confirm the word isn't already accepted (case-insensitive)
grep -i "<yourword>" cspell.json

# 2. If not present, open cspell.json and add the word to the `words` array
#    Keep alphabetical ordering — the existing list is alphabetised, preserve that.

# 3. Verify
npx cspell --no-progress "**/*" 2>&1 | grep -i "<yourword>"  # should print nothing
```

### Edit by hand (preferred for one or two words)

Open `cspell.json`, find the right alphabetical slot, insert your word as a JSON string.

### Programmatic add (multiple words at once)

If you have a list of words to add, write a one-off script — but commit only the JSON change, not the script:

```bash
# Example: append a batch, then sort + dedupe in place
python3 -c "
import json
with open('cspell.json') as f: d = json.load(f)
new = ['yourword1', 'yourword2']
d['words'] = sorted(set(d['words']) | set(new), key=str.lower)
with open('cspell.json', 'w') as f: json.dump(d, f, indent=4)
    f.write('\n')
"
```

The CI workflow accepts either lowercase or mixed-case entries; the file already contains both (e.g. `Algr`, `algorand`). Match the **casing the word naturally appears in**.

## Known typos (third-party APIs)

JSON doesn't support inline comments, so you can't annotate a known-typo entry inline. Options:

1. **Preferred** — wrap or rename at the boundary so the typo doesn't leak into firefly code. Example:

    ```typescript
    type ApiResponse = { invaildField: string };
    // Map at the edge:
    const data: ApiResponse = await api.get();
    const fixed = { invalidField: data.invaildField };
    ```

    Then there's nothing for cspell to flag in your own code.

2. **If that's impractical**, add the typo to `cspell.json` and note it in the commit message that adds it:
    ```
    chore(cspell): allow "invaild" — typo in Hyperliquid API response field
    ```
    Future maintainers can `git blame cspell.json` to find the reason.

## Ordering convention

The existing list is sorted case-insensitively, ascending. When inserting, place your word so the alphabetical order is preserved. `cspell` doesn't require this — it's a maintainability convention.

A re-sort is fine if the list has drifted:

```bash
python3 -c "
import json
with open('cspell.json') as f: d = json.load(f)
d['words'] = sorted(set(d['words']), key=str.lower)
with open('cspell.json', 'w') as f:
    json.dump(d, f, indent=4)
    f.write('\n')
"
```

Just make sure you understand why words were duplicated (e.g. different casings might be intentional) before deduplicating.

## Speed tips while iterating

Running `npx cspell --no-progress "**/*"` on the full repo takes ~tens of seconds. While iterating:

```bash
# Only files you changed
git diff --name-only origin/main...HEAD | xargs -I{} npx cspell --no-progress "{}"

# A single file
npx cspell apps/web/src/components/Foo.tsx
```

The full run still matters before pushing — CI does the whole project.

## Common categories of words to expect

If you're seeing cspell errors in unfamiliar territory, you're probably touching one of these:

| Domain            | Examples                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| Chains            | `arbitrum`, `solana`, `aptos`, `algorand`, `base`, `boba`, `astar`, `avax`          |
| Social networks   | `farcaster`, `lens`, `bluesky`, `atproto`, `warpcast`                               |
| Trading           | `hyperliquid`, `perps`, `kline`, `orderbook`                                        |
| Build tools       | `tsgo`, `tamagui`, `lingui`, `tolgee`, `radix`, `turbo`, `vite`, `vitest`, `vercel` |
| Crypto primitives | `bignumber`, `bitcoin`, `ethereum`, `secp256k1`                                     |
| UI                | `appkit`, `Automator`, `Bookmarkable`                                               |

For words in these domains, you can usually add to `cspell.json` confidently. For anything outside these domains, double-check it isn't a typo first.
