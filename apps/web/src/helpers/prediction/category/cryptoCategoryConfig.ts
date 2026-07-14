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

export interface CryptoCategorySecondaryConfig {
    slug: string;
    /** English label (translated at render time via `resolvePredictionCategoryLabel`). */
    label: string;
    /**
     * Polymarket tag slug used to fetch events via `getGammaEvents`.
     * `null` for `quick-buy` (fetches by period tag) and `all` (uses the `crypto` event-list).
     */
    tagSlug: string | null;
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
 * Secondary tabs (2nd level) in nav order. Quick Buy leads, followed by the 9 topic categories.
 *
 * `tagSlug` values were probed against `/v1/polymarket/gamma/events?tag_slug=X`. Confirmed:
 * `weekly`, `monthly`, `yearly`, `pre-market`, `industry`. The `// TODO(fw-7878)` entries fall
 * back to the slug itself until the Polymarket tag is confirmed — trivial to correct here.
 */
export const CRYPTO_SECONDARY_CATEGORIES: readonly CryptoCategorySecondaryConfig[] = [
    { slug: CRYPTO_QUICK_BUY_SLUG, label: 'Quick Buy', tagSlug: null },
    { slug: CRYPTO_ALL_SLUG, label: 'All', tagSlug: null },
    { slug: 'weekly', label: 'Weekly', tagSlug: 'weekly' },
    { slug: 'monthly', label: 'Monthly', tagSlug: 'monthly' },
    { slug: 'yearly', label: 'Yearly', tagSlug: 'yearly' },
    // TODO(fw-7878): confirm Polymarket tag slug.
    { slug: 'targets', label: 'Targets', tagSlug: 'targets' },
    { slug: 'pre-market', label: 'Pre-Market', tagSlug: 'pre-market' },
    // TODO(fw-7878): confirm Polymarket tag slug.
    { slug: 'institutions', label: 'Institutions', tagSlug: 'institutions' },
    { slug: 'industry', label: 'Industry', tagSlug: 'industry' },
    // TODO(fw-7878): confirm Polymarket tag slug.
    { slug: 'protocol-metrics', label: 'Protocol Metrics', tagSlug: 'protocol-metrics' },
];

/**
 * Quick Buy periods (3rd level), default = `1h`.
 *
 * Confirmed tags: `5m`, `hourly` (1h), `daily`. The `// TODO(fw-7878)` entries (`15m`, `4h`)
 * fall back to the slug until confirmed.
 */
export const CRYPTO_QUICK_BUY_PERIODS: readonly CryptoCategoryPeriodConfig[] = [
    { slug: '5m', label: '5 Min', mobileLabel: '5m', tagSlug: '5m' },
    // TODO(fw-7878): confirm Polymarket tag slug (5m is confirmed, 15m is not).
    { slug: '15m', label: '15 Min', mobileLabel: '15m', tagSlug: '15m' },
    { slug: '1h', label: '1 Hour', mobileLabel: '1hr', tagSlug: 'hourly' },
    // TODO(fw-7878): confirm Polymarket tag slug.
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
 * Every other secondary (Quick Buy, Targets, Pre-Market, Institutions, Industry, Protocol Metrics)
 * shows its translated tab label verbatim as the title.
 */
const CRYPTO_TITLE_SUFFIX_SLUGS = new Set(['all', 'weekly', 'monthly', 'yearly']);

/**
 * Resolve the big header title for a Crypto secondary tab.
 *
 * For the period roll-ups (All/Weekly/Monthly/Yearly) the title is "{label} Crypto" — looked up as
 * a single compound translation so each locale renders it naturally (e.g. ja "週次の暗号資産"). For
 * every other secondary it returns the translated tab label, matching the chip text in
 * {@link PredictionCategoryCryptoSecondaryNav}.
 */
export function resolveCryptoCategoryTitle(locale: string, label: string, slug: string): string {
    if (CRYPTO_TITLE_SUFFIX_SLUGS.has(slug)) {
        return resolvePredictionCategoryLabel(locale, `${label} Crypto`);
    }
    return resolvePredictionCategoryLabel(locale, label);
}

function toSlugItem(
    item: { slug: string; label: string },
    sub_slug: PolymarketEventSlugListData[] = [],
): PolymarketEventSlugListData {
    return { slug: item.slug, label: item.label, sub_slug };
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
