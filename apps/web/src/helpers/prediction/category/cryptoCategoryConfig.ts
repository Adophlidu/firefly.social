import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

/**
 * Frontend-defined 2nd/3rd-level tab tree for the Crypto primary category.
 *
 * The backend (`/v1/polymarket/slugs/list`) returns `crypto` as a top-level slug with an empty
 * `sub_slug`, and this Story is web-only — so the whole tree (Quick Buy periods + topic
 * categories) is defined here and grafted onto the `crypto` node via
 * {@link enrichSlugListWithCryptoTree}. That lets the existing routing/context machinery
 * (`resolveCategorySlugContext`, `buildPredictionCategoryHref`, …) resolve `crypto/quick-buy/1h`
 * etc. without a single routing fork.
 *
 * Mirrors {@link PolymarketEventSlugListData} so the synthetic nodes flow through the same
 * context resolution as backend-provided slugs.
 */

/** Secondary slug of the leading "Quick Buy" chip (carries the period children). */
export const CRYPTO_QUICK_BUY_SLUG = 'quick-buy';
/** Secondary slug of the "All" chip (uses the `crypto` event-list endpoint, volume-ordered). */
export const CRYPTO_ALL_SLUG = 'all';

/** Default Quick Buy period (the depth-2 → depth-3 redirect target). */
export const CRYPTO_DEFAULT_PERIOD_SLUG = '1h';

/**
 * Numeric Polymarket tag ID for the `crypto` slug. Used to intersect crypto with a period/feature
 * tag server-side via `tag_id=[CRYPTO_TAG_ID, <tagId>]` + `tag_match=all`: the gamma `/events`
 * endpoint only ANDs repeated `tag_id` when `tag_match=all` is set (repeated `tag_slug` is OR, and
 * drops the period filter entirely — verified live). See {@link CryptoCategorySecondaryConfig.tagId}.
 */
export const CRYPTO_TAG_ID = 21;

/**
 * Polymarket tag ID for ETF-flow markets (`etf`). Quick Buy excludes it server-side via
 * `exclude_tag_id` — these daily flow markets slug-match a coin but aren't up/down price markets, so
 * they'd otherwise leak into Quick Buy and render via `BetItem` (countdown / volume / NEW).
 */
export const CRYPTO_ETF_TAG_ID = 833;

export interface CryptoCategorySecondaryConfig {
    slug: string;
    /** English label (translated at render time via `resolvePredictionCategoryLabel`). */
    label: string;
    /**
     * Polymarket tag slug used to fetch events via `getGammaEvents`.
     * `null` for `quick-buy` (fetches by period tag) and `all` (uses the `crypto` event-list).
     */
    tagSlug: string | null;
    /**
     * Polymarket tag IDs fetched via `getGammaEvents`. Period tabs (weekly/monthly/yearly) intersect
     * crypto with their tag (`[CRYPTO_TAG_ID, <tagId>]`, `tag_match=all`). The five topic tabs are
     * `tag_match=any` unions of crypto-inherent tags (no crypto AND — those tags carry no non-crypto
     * events): Industry `[crypto-legal, crypto-culture, protocol-risk, protocol-upgrade]`;
     * Institutions `[crypto-listings, gov-reserve, crypto-treasury, corporate-financials, etf]`
     * (liveOnly — `end_date_min` drops the past-day ETF-flow zombies the `etf` tag brings); Targets
     * `[price-milestone, price-comparison, nft]`; Pre-Market `[pre-market, public-sales,
     * token-sales]` minus `ipos` (excludeTagIds — IPOs stay in Institutions); Protocol Metrics
     * `[tvl, open-interest, network-stats, fees]`. Omitted for `quick-buy`/`all`.
     */
    tagIds?: number[];
    /** How to combine {@link tagIds}: `'all'` (AND, default) or `'any'` (OR, Protocol Metrics). */
    tagMatch?: 'all' | 'any';
    /**
     * Hide events whose endDate already passed (server-side `end_date_min=now`) — drops zombie
     * recurring markets (e.g. the daily ETF flows that `etf` brings into Institutions) while keeping
     * live ones. Institutions uses this because it unions the `etf` tag.
     */
    liveOnly?: boolean;
    /**
     * Tag IDs to exclude server-side (`exclude_tag_id`). Pre-Market unions `pre-market` but excludes
     * `ipos` so IPO events stay in Institutions.
     */
    excludeTagIds?: number[];
    /** Optional chip icon (backend media URL) shared by both themes; omitted renders no icon. */
    icon?: string;
}

export interface CryptoCategoryPeriodConfig {
    slug: string;
    /** English full label shown on desktop (e.g. "1 Hour"). */
    label: string;
    /** Compact label shown on mobile (e.g. "1hr"). */
    mobileLabel: string;
    /** Polymarket tag slug for the period. */
    tagSlug: string;
}

/**
 * Secondary tabs (2nd level) in nav order. Quick Buy leads, then the topic categories. tagSlug is
 * the primary Polymarket tag (documentation); the actual fetch uses `tagIds` + `tagMatch`. Period
 * tabs (weekly/monthly/yearly) AND crypto with their tag (`tag_match=all`); the five topic
 * tabs (industry/institutions/targets/pre-market/protocol-metrics) OR crypto-inherent tags
 * (`tag_match=any`, no crypto AND). IDs confirmed live against gamma-api (`GET /tags/slug/{slug}`):
 * crypto(21), weekly(102264), monthly(102144), yearly(102536), pre-market(102368),
 * public-sales(102860), token-sales(102859), ipos(600), crypto-legal(105292),
 * crypto-culture(105289), protocol-risk(105220), protocol-upgrade(105291),
 * crypto-listings(105297), gov-reserve(105296), crypto-treasury(105293),
 * corporate-financials(105300), etf/Institutions-flows(833), price-milestone(105299),
 * price-comparison(105301), nft(1327), tvl(104698), open-interest(105287), network-stats(105288),
 * fees(102809).
 */
/** Chip icon for Quick Buy — the sports "live" broadcast pictogram (shared by both themes). */
const CRYPTO_QUICK_BUY_ICON = 'https://media.firefly.land/polymarket/live-x4.png';

export const CRYPTO_SECONDARY_CATEGORIES: readonly CryptoCategorySecondaryConfig[] = [
    { slug: CRYPTO_QUICK_BUY_SLUG, label: 'Quick Buy', tagSlug: null, icon: CRYPTO_QUICK_BUY_ICON },
    { slug: CRYPTO_ALL_SLUG, label: 'All', tagSlug: null },
    { slug: 'weekly', label: 'Weekly', tagSlug: 'weekly', tagIds: [CRYPTO_TAG_ID, 102264] },
    { slug: 'monthly', label: 'Monthly', tagSlug: 'monthly', tagIds: [CRYPTO_TAG_ID, 102144] },
    { slug: 'yearly', label: 'Yearly', tagSlug: 'yearly', tagIds: [CRYPTO_TAG_ID, 102536] },
    {
        slug: 'targets',
        label: 'Targets',
        tagSlug: 'price-milestone',
        tagIds: [105299, 105301, 1327],
        tagMatch: 'any',
    },
    {
        slug: 'pre-market',
        label: 'Pre-Market',
        tagSlug: 'pre-market',
        tagIds: [102368, 102860, 102859],
        tagMatch: 'any',
        excludeTagIds: [600],
    },
    {
        slug: 'institutions',
        label: 'Institutions',
        tagSlug: 'crypto-listings',
        tagIds: [105297, 105296, 105293, 105300, 833],
        tagMatch: 'any',
        liveOnly: true,
    },
    {
        slug: 'industry',
        label: 'Industry',
        tagSlug: 'crypto-legal',
        tagIds: [105292, 105289, 105220, 105291],
        tagMatch: 'any',
    },
    {
        slug: 'protocol-metrics',
        label: 'Protocol Metrics',
        tagSlug: 'tvl',
        tagIds: [104698, 105287, 105288, 102809],
        tagMatch: 'any',
    },
];

/**
 * Quick Buy periods (3rd level), default = `1h`. All tag slugs confirmed live against gamma-api.
 */
export const CRYPTO_QUICK_BUY_PERIODS: readonly CryptoCategoryPeriodConfig[] = [
    { slug: '5m', label: '5 Min', mobileLabel: '5m', tagSlug: '5m' },
    { slug: '15m', label: '15 Min', mobileLabel: '15m', tagSlug: '15m' },
    { slug: '1h', label: '1 Hour', mobileLabel: '1hr', tagSlug: '1h' },
    { slug: '4h', label: '4 Hours', mobileLabel: '4hrs', tagSlug: '4h' },
    { slug: 'daily', label: 'Daily', mobileLabel: 'Daily', tagSlug: 'daily' },
];

export function getCryptoSecondaryCategory(slug: string): CryptoCategorySecondaryConfig | undefined {
    return CRYPTO_SECONDARY_CATEGORIES.find((item) => item.slug === slug);
}

export function getCryptoPeriod(slug: string): CryptoCategoryPeriodConfig | undefined {
    return CRYPTO_QUICK_BUY_PERIODS.find((item) => item.slug === slug);
}

export function getCryptoDefaultPeriod(): CryptoCategoryPeriodConfig {
    // `1h` is always present in CRYPTO_QUICK_BUY_PERIODS.
    return getCryptoPeriod(CRYPTO_DEFAULT_PERIOD_SLUG)!;
}

/**
 * Secondary slugs whose header title is rendered as "{label} Crypto" — the four period roll-ups.
 * Every other secondary (Targets, Pre-Market, Institutions, Industry, Protocol Metrics) shows its
 * translated tab label verbatim as the title. Quick Buy is special-cased below to the primary
 * category "Crypto" (its chip text stays "Quick Buy" — the active period surfaces separately).
 */
const CRYPTO_TITLE_SUFFIX_SLUGS = new Set(['all', 'weekly', 'monthly', 'yearly']);

/**
 * Resolve the big header title for a Crypto secondary tab.
 *
 * For the period roll-ups (All/Weekly/Monthly/Yearly) the title is "{label} Crypto" — looked up as
 * a single compound translation so each locale renders it naturally (e.g. ja "週次の暗号資産"). For
 * every other secondary it returns the translated tab label, matching the chip text in
 * {@link PredictionCategoryCryptoSecondaryNav}. Quick Buy is the exception: its header reads the
 * primary category "Crypto" while the active period is shown in the separate
 * `PredictionCategoryCryptoPeriodSwitcher`.
 */
export function resolveCryptoCategoryTitle(locale: string, label: string, slug: string): string {
    // Quick Buy surfaces the primary category as its title; the active period is shown in the
    // separate PredictionCategoryCryptoPeriodSwitcher, so the header reads "Crypto", not "Quick Buy".
    if (slug === CRYPTO_QUICK_BUY_SLUG) {
        return resolvePredictionCategoryLabel(locale, 'Crypto');
    }
    if (CRYPTO_TITLE_SUFFIX_SLUGS.has(slug)) {
        return resolvePredictionCategoryLabel(locale, `${label} Crypto`);
    }
    return resolvePredictionCategoryLabel(locale, label);
}

function toSlugItem(
    item: { slug: string; label: string; icon?: string },
    sub_slug: PolymarketEventSlugListData[] = [],
): PolymarketEventSlugListData {
    return {
        slug: item.slug,
        label: item.label,
        sub_slug,
        ...(item.icon ? { icon_day: item.icon, icon_night: item.icon } : {}),
    };
}

/** Quick Buy period children as slug-tree nodes (for routing resolution). */
export function buildCryptoQuickBuyPeriodItems(): PolymarketEventSlugListData[] {
    return CRYPTO_QUICK_BUY_PERIODS.map((period) => toSlugItem(period));
}

/** The default period (`1h`) as a slug-tree node — the depth-2 → depth-3 redirect target. */
export function getCryptoDefaultPeriodItem(): PolymarketEventSlugListData {
    return toSlugItem(getCryptoDefaultPeriod());
}

/**
 * The synthetic Crypto secondary tree. The `quick-buy` node carries the 5 period children so
 * `crypto/quick-buy/1h` resolves to depth 3; every other secondary is a leaf.
 */
export function buildCryptoSlugTree(): PolymarketEventSlugListData[] {
    return CRYPTO_SECONDARY_CATEGORIES.map((item) =>
        toSlugItem(item, item.slug === CRYPTO_QUICK_BUY_SLUG ? buildCryptoQuickBuyPeriodItems() : []),
    );
}
