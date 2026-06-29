# FIFWC Bracket Tab — Design

**Date:** 2026-06-26
**Scope:** Add a fourth tab ("Bracket" / 晋级图) to the FIFA World Cup prediction category page (`/prediction/category/.../fifwc`), rendering the knockout-stage tournament tree in the Xiaohongshu (RED) visual style.

## Goal

Next to the existing **Games / Props / Groups** tabs, add a **Bracket** tab that shows the World Cup knockout tree: Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final. Layout follows the Xiaohongshu reference: a top round-pill switcher with a sliding two-round window, two columns of match cards connected by bracket lines, kickoff date/time per card, team flags + localized names + scores, the final highlighted with a trophy, and (when data permits) a third-place node. Match cards link to their betting market when one exists.

## Data feasibility (investigated)

- **Polymarket has no bracket API endpoint.** Their `/sports/world-cup/bracket` page server-renders the whole tree via Next.js `getStaticProps`/ISR and ships it as a page prop `__NEXT_DATA__.props.pageProps.bracket` (~190KB, regenerated every few minutes).
- The bracket prop **does carry full tree connectivity**: each match has `feedsIntoMatchId` (child → parent link). 31 matches total (`r32`×16, `r16`×8, `qf`×4, `sf`×2, `final`×1). **No third-place node** in their data.
- Firefly's own backend currently exposes only `/v1/fifa/groups/score` (group standings) — no bracket endpoint.
- Per-match data exists but is **not localized** (team `name` is always English) and has **no machine timestamp** — kickoff time lives only in a pre-localized `subheader` string.

### Exact Polymarket data contract (verbatim)

Round object: `{ id, matches }` only — no label field (label is mapped client-side from `id`).

Match object keys: `id, roundId, eventSlug, marketSlugs, status, location, subheader, teams, probabilities, scores, feedsIntoMatchId`.

```jsonc
// r32-2 — both teams known
{
    "id": "r32-2",
    "roundId": "r32",
    "eventSlug": null,
    "marketSlugs": [null, null],
    "status": "upcoming",
    "location": "Los Angeles",
    "subheader": "6月28日 GMT-4 15:00",
    "teams": [
        {
            "id": "3270264",
            "countryCode": "RSA",
            "name": "South Africa",
            "flagUrl": "https://polymarket-upload.s3.us-east-2.amazonaws.com/South Africa-ddc27e566d.png",
            "teamColor": "#10704b",
        },
        {
            "id": "3270253",
            "countryCode": "CAN",
            "name": "Canada",
            "flagUrl": "...Canada-...png",
            "teamColor": "#d62b1f",
        },
    ],
    "probabilities": null,
    "scores": null,
    "feedsIntoMatchId": "r16-1",
}
// fully TBD slot: "teams": [null, null], "status": "tbd"
// final-0: "roundId":"final", "feedsIntoMatchId": null
```

Notes that drive the normalizer:

- **No timestamp.** Time only in `subheader`, format (zh): `(\d+)月(\d+)日 GMT-4 (\d+):(\d+)`. Timezone is literally baked as `GMT-4` (US/Eastern; constant across the whole tournament window — no DST crossing in Jun–Jul 2026). No year, no weekday.
- **`teams` entry is the whole object or `null`.** Team object: `{ id, countryCode (3-letter UC), name (English), flagUrl (full HTTPS URL, filename has an unencoded space — encode before use), teamColor (#hex) }`.
- **`status`** is `"upcoming"` / `"tbd"` / (live values) and is independent of whether both teams are known.
- **`scores` / `probabilities` / `eventSlug` / `marketSlugs` are `null` for every match right now** (knockout markets not yet open). Their populated shape is **unconfirmed** — `marketSlugs`/`teams` are consistently 2-tuples, so `scores`/`probabilities` are _inferred_ to be 2-tuples aligned to team sides. Treat all four as optional with graceful degradation.
- `worldCupUpdateMetadata`: `{ updatedAt: ISO8601, formattedDate: localized }` — the only real timestamp; page regeneration time.

## Architecture

### Swappable data seam (key constraint)

The data source is expected to move to a backend endpoint (`/v1/fifa/bracket`) later. To make that a one-line swap:

- **`FifaBracketData` is the stable contract.** Component, react-query, and types only ever see normalized `FifaBracketData`. They never see Polymarket's raw shape.
- **`getWorldCupBracket()` provider is the single seam.** Today its body calls our Next.js route (`/api/polymarket/world-cup-bracket`). To switch to the backend later, change only the URL inside this provider (to `urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/bracket', { locale })`) and delete the route — no component changes.
- **Normalization is an isolated pure function** (`normalizePolymarketBracket`) used by the route. When the backend takes over normalization, the route + this helper are deleted together; the contract type stays.

```
Browser ──same-origin──> GET /api/polymarket/world-cup-bracket   (Next.js Route Handler, edge)
                              │ server-side fetch (no CORS)
                              ▼
                  polymarket.com/zh/sports/world-cup/bracket  (HTML)
                              │ extract __NEXT_DATA__ → props.pageProps.bracket
                              │ normalizePolymarketBracket()  (pure)
                              ▼
                  FifaBracketData  ── createSuccessResponseJson ──> getWorldCupBracket() ──> react-query ──> UI
```

### Components & files

**Types** — `apps/web/src/providers/types/Firefly.ts` (or a colocated bracket types file):

```ts
type FifaBracketRoundId =
    | 'r32'
    | 'r16'
    | 'qf'
    | 'sf'
    | 'final';
interface FifaBracketTeam {
    countryCode: string;
    name: string;
    flagUrl: string;
    teamColor: string;
}
interface FifaBracketMatch {
    id: string;
    roundId: FifaBracketRoundId;
    startTime: string | null; // normalized ISO 8601
    status: 'tbd' | 'upcoming' | string;
    teams: [FifaBracketTeam | null, FifaBracketTeam | null];
    scores: [number, number] | null; // optional, currently null
    marketSlugs: [string | null, string | null];
    eventSlug: string | null;
    feedsIntoMatchId: string | null; // tree connectivity
}
interface FifaBracketRound {
    id: FifaBracketRoundId;
    matches: FifaBracketMatch[];
}
interface FifaBracketData {
    rounds: FifaBracketRound[];
    updatedAt: string | null;
}
```

**Route Handler** — `apps/web/src/app/api/polymarket/world-cup-bracket/route.ts`:

- `runtime = 'edge'`, `GET = compose(withRequestErrorHandler(), …)`, returns `createSuccessResponseJson(data)` — mirrors `api/polymarket/events/route.ts`.
- Fetch `https://polymarket.com/zh/sports/world-cup/bracket` (pinned zh locale so `subheader` parsing is deterministic; team names are English regardless of locale, so route output stays locale-agnostic).
- Extract `<script id="__NEXT_DATA__">…</script>`, `JSON.parse`, read `props.pageProps.bracket` + `worldCupUpdateMetadata.updatedAt`.
- Run `normalizePolymarketBracket()`.
- Caching: `Cache-Control: s-maxage≈120, stale-while-revalidate` (Polymarket is minutes-level ISR).
- **Fallback:** any fetch/parse failure → return `{ rounds: [], updatedAt: null }` (200) so the UI shows the empty state rather than erroring. Log server-side.

**Normalizer** — `apps/web/src/helpers/prediction/category/bracket/normalizePolymarketBracket.ts` (pure):

- Maps raw rounds/matches → `FifaBracketData`.
- `parseBracketSubheader(subheader)`: regex `(\d+)月(\d+)日 GMT-4 (\d+):(\d+)` → construct an instant at America/New_York (fixed −04:00) with year **2026** → ISO string; returns `null` if unparseable.
- Passes through `feedsIntoMatchId`, `marketSlugs`, `eventSlug`, `status`, `scores` (optional).
- Keeps team `name` (English) + `countryCode` + `flagUrl` (URL-encoded) + `teamColor`; **does not localize** (client does).

**Provider (the seam)** — `apps/web/src/providers/prediction/polymarket/getWorldCupBracket.ts`:

- `getWorldCupBracket(): Promise<FifaBracketData>` — fetches the same-origin route via `fetchJson`, unwraps the response, returns `FifaBracketData`. The only place the data source URL is named.

**Tab wiring** (mirror the existing `groups` gate exactly):

- `helpers/prediction/category/constants.ts`: add `PREDICTION_CATEGORY_BRACKET_TAB = 'bracket'`; extend `PredictionCategoryTab`.
- `hooks/prediction/useCategoryGamesPropsAvailability.ts`: add `hasBracket = isFifaCategoryContext(context)`.
- `helpers/prediction/category/categoryGamesPropsTabAvailability.ts`: `resolveCategoryGamesPropsTabs` pushes the bracket tab when `hasBracket` (both the `showGamesPropsTabs` and the non-`showGamesPropsTabs` branches, mirroring `hasGroups`).
- `components/Prediction/Category/PredictionCategoryTabs.tsx`: add a 4th button `<Trans>Bracket</Trans>`; telemetry `capturePolymarketHomeSportTypeClick('bracket', categorySlug)`.
- `components/Prediction/Category/PredictionCategoryPage.tsx`: add `bracket` to the `parseAsStringEnum`; add render branch `effectiveTab === PREDICTION_CATEGORY_BRACKET_TAB → <PredictionCategoryBracketList />`.
- Tab order: Games / Props / Groups / **Bracket**.

**UI component** — `apps/web/src/components/Prediction/Category/PredictionCategoryBracketList.tsx`:

- react-query `['prediction','category','fifa-bracket']` → `getWorldCupBracket`. `FootballLoading` while pending; `NoResultsFallback` on empty/error.
- **Round-pill nav** — pills `1/16 决赛 · 1/8 决赛 · 1/4 决赛 · 半决赛 · 决赛` (labels mapped from `roundId` via i18n). Sliding **two-round window**: selecting round N shows columns for N and N+1 (the round its winners feed into); the active pill pair is highlighted (matches reference images).
- **Two-column + connectors** — left column = round N matches, right column = round N+1; group left cards under their `feedsIntoMatchId` target (2 left → 1 right). Connector lines drawn with **CSS right-angle borders** (the reference uses square ┤ connectors; no SVG).
- **Match card** — kickoff datetime formatted from `startTime` ISO into the viewer's locale + timezone with weekday (via existing date formatting + Lingui), e.g. `06月30日 周二 04:30`; two team rows (encoded `flagUrl` + `useLocalizedSportsTeamName(name)` + score or `-`); TBD slot renders a grey placeholder + `<Trans>TBD</Trans>`. Card is clickable when a `marketSlug` is present → `openPredictionPage(slug, { outcome })` + `capturePolymarketOrderClick` (same as Groups); non-clickable otherwise.
- **Final** — trophy highlight styling (reference image 4). **Third place** — render only if the data provides such a node (Polymarket does not today; leave a render slot, hidden when absent).
- Mobile/desktop grids via `md:` breakpoints, following `PredictionCategoryGroupsList.tsx` conventions.

## Error handling & edge cases

- Route fetch/parse failure → empty `FifaBracketData` (UI empty state), never a 5xx to the client.
- Unparseable `subheader` → `startTime: null`; card omits the datetime line.
- All `marketSlugs` null currently → all cards non-clickable until knockout markets open; clickable path must degrade silently.
- `scores`/`probabilities` null → omitted; show `-`.
- Polymarket markup/locale change → normalizer returns empty rather than throwing; covered by tests.

## Testing (Vitest, `apps/web/tests/`)

- `normalizePolymarketBracket` unit tests: `subheader`→ISO across cases incl. cross-timezone arithmetic (GMT-4 → GMT+8 weekday/time), TBD & partial-TBD slots, `feedsIntoMatchId` tree integrity, malformed-input fallback to empty.
- `resolveCategoryGamesPropsTabs` with bracket combinations (bracket-only, with groups, with games/props).
- Locale-invariance test for the route output / team-name resolution (cf. `sportLocaleInvariance.test.ts`).

## Implementation order

1. Types + `normalizePolymarketBracket` (+ unit tests) — pure, no network.
2. Route Handler + `getWorldCupBracket` provider — runnable against live Polymarket / mock.
3. Tab wiring (constants, availability, tabs, page).
4. `PredictionCategoryBracketList` UI incl. pill nav + CSS connectors + card.

## Out of scope / risks

- **No backend dependency now**; backend `/v1/fifa/bracket` swap is a future one-liner in the provider (see seam).
- Depends on Polymarket's undocumented `__NEXT_DATA__` shape — brittle; mitigated by empty-fallback + tests.
- `scores`/`probabilities` populated shapes unverified; revisit once knockout markets open.
- Third-place playoff has no current data source.
