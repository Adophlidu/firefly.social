import { CryptoPriceVariant } from '@/providers/prediction/polymarket/constants.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import { PredictionRecurrence } from '@/types/prediction.js';

/** Short-interval crypto Up/Down markets encoded in the slug (Polymarket frontend conventions). */
export type CryptoUpDownInterval = '5m' | '15m' | '4h';

const UP_DOWN_SLUG = /-up(?:-or-down|down)(?:-|$)/i;
const FIVE_MINUTE_UP_DOWN = /-up(?:-or-down|down)-5m-(\d+)$/i;
const FIFTEEN_MINUTE_UP_DOWN = /-up(?:-or-down|down)-15m-(\d+)$/i;
const FOUR_HOUR_UP_DOWN = /-up(?:-or-down|down)-4h-(\d+)$/i;
const HOURLY_UP_DOWN = /-up(?:-or-down|down)-[a-z]+-\d+-\d{4}-\d{1,2}(?:am|pm)-et$/i;
const DAILY_UP_DOWN = /-up-or-down-on-[a-z]+-\d+(?:-\d{4})?$/i;
const MULTISTRIKE_4H = /-multistrike-4h(?:-|$)/i;

const INTERVAL_TO_RECURRENCE: Record<CryptoUpDownInterval, PredictionRecurrence> = {
    '5m': PredictionRecurrence.FiveMinutes,
    '15m': PredictionRecurrence.FifteenMinutes,
    '4h': PredictionRecurrence.FourHours,
};

const INTERVAL_TO_VARIANT: Record<CryptoUpDownInterval, CryptoPriceVariant> = {
    '5m': CryptoPriceVariant.FiveMinutes,
    '15m': CryptoPriceVariant.Fifteen,
    '4h': CryptoPriceVariant.FourHour,
};

export interface CryptoUpDownShortMarket {
    kind: 'crypto-up-down-short';
    interval: CryptoUpDownInterval;
    recurrence: PredictionRecurrence;
    variant: CryptoPriceVariant;
    /** Unix seconds at the end of the slug (`…-5m-1716123456`). */
    windowStartUnix: number;
    slug: string;
}

export interface PolymarketMultistrike4hMarket {
    kind: 'multistrike-4h';
    slug: string;
}

export interface PolymarketHourlyUpDownMarket {
    kind: 'hourly-up-down';
    slug: string;
}

export interface PolymarketDailyUpDownMarket {
    kind: 'daily-up-down';
    slug: string;
}

export interface PolymarketOtherCryptoMarket {
    kind: 'other';
    slug: string | null;
    isUpDownFamily: boolean;
}

export type PolymarketCryptoMarketClassification =
    | CryptoUpDownShortMarket
    | PolymarketMultistrike4hMarket
    | PolymarketHourlyUpDownMarket
    | PolymarketDailyUpDownMarket
    | PolymarketOtherCryptoMarket;

export type PolymarketEventLike = Pick<PolymarketEvent, 'slug' | 'markets'>;

function normalizeSlug(slug: string | null | undefined): string | null {
    const trimmed = slug?.trim();
    if (!trimmed) return null;
    return trimmed.toLowerCase();
}

/**
 * Resolves the slug used for classification: event.slug first, then the first market slug.
 */
export function getPolymarketEventSlug(event: PolymarketEventLike): string | null {
    const eventSlug = normalizeSlug(event.slug);
    if (eventSlug) return eventSlug;

    for (const market of event.markets ?? []) {
        const marketSlug = normalizeSlug(market.slug);
        if (marketSlug) return marketSlug;
    }

    return null;
}

function parseShortUpDown(slug: string): CryptoUpDownShortMarket | null {
    // Match order mirrors polymarket.com: 4h → 5m → 15m (suffixes are mutually exclusive).
    const fourHour = FOUR_HOUR_UP_DOWN.exec(slug);
    if (fourHour) {
        return buildShortResult(slug, '4h', fourHour[1]);
    }

    const fiveMin = FIVE_MINUTE_UP_DOWN.exec(slug);
    if (fiveMin) {
        return buildShortResult(slug, '5m', fiveMin[1]);
    }

    const fifteenMin = FIFTEEN_MINUTE_UP_DOWN.exec(slug);
    if (fifteenMin) {
        return buildShortResult(slug, '15m', fifteenMin[1]);
    }

    return null;
}

function buildShortResult(slug: string, interval: CryptoUpDownInterval, unixSeconds: string): CryptoUpDownShortMarket {
    return {
        kind: 'crypto-up-down-short',
        interval,
        recurrence: INTERVAL_TO_RECURRENCE[interval],
        variant: INTERVAL_TO_VARIANT[interval],
        windowStartUnix: Number.parseInt(unixSeconds, 10),
        slug,
    };
}

/**
 * Classify a Polymarket slug (crypto Up/Down and related series types).
 */
export function classifyPolymarketCryptoSlug(slug: string | null | undefined): PolymarketCryptoMarketClassification {
    const normalized = normalizeSlug(slug);
    if (!normalized) {
        return { kind: 'other', slug: null, isUpDownFamily: false };
    }

    const short = parseShortUpDown(normalized);
    if (short) return short;

    if (MULTISTRIKE_4H.test(normalized)) {
        return { kind: 'multistrike-4h', slug: normalized };
    }

    if (HOURLY_UP_DOWN.test(normalized)) {
        return { kind: 'hourly-up-down', slug: normalized };
    }

    if (DAILY_UP_DOWN.test(normalized)) {
        return { kind: 'daily-up-down', slug: normalized };
    }

    return {
        kind: 'other',
        slug: normalized,
        isUpDownFamily: UP_DOWN_SLUG.test(normalized),
    };
}

/**
 * Returns `5m` | `15m` | `4h` when the event is a short-interval crypto Up/Down market; otherwise `null`.
 */
export function getCryptoUpDownIntervalFromEvent(event: PolymarketEventLike): CryptoUpDownInterval | null {
    const classification = classifyPolymarketCryptoSlug(getPolymarketEventSlug(event));
    return classification.kind === 'crypto-up-down-short' ? classification.interval : null;
}

/**
 * Returns Polymarket `CryptoPriceVariant` for short-interval markets (for crypto-price API), else `null`.
 */
export function getCryptoPriceVariantFromEvent(event: PolymarketEventLike): CryptoPriceVariant | null {
    const classification = classifyPolymarketCryptoSlug(getPolymarketEventSlug(event));
    return classification.kind === 'crypto-up-down-short' ? classification.variant : null;
}

/**
 * Full classification from a Polymarket event (uses `event.slug`, falls back to `markets[].slug`).
 */
export function resolveCryptoUpDownFromEvent(event: PolymarketEventLike): PolymarketCryptoMarketClassification {
    return classifyPolymarketCryptoSlug(getPolymarketEventSlug(event));
}

/** Type guard for 5m / 15m / 4h Up/Down events. */
export function isCryptoUpDownShortEvent(event: PolymarketEventLike): event is PolymarketEventLike & { slug: string } {
    return resolveCryptoUpDownFromEvent(event).kind === 'crypto-up-down-short';
}

function isPredictionRecurrence(value: string): value is PredictionRecurrence {
    return (Object.values(PredictionRecurrence) as string[]).includes(value);
}

/**
 * Resolves `PredictionRecurrence` from a Polymarket event.
 *
 * Priority: slug patterns (5m / 15m / 4h / daily / multistrike-4h) → `event.series[0].recurrence`.
 * Hourly Up/Down slugs and unrecognized markets return `null` unless series recurrence is set.
 */
export function getPredictionRecurrenceFromPolymarketEvent(event: PolymarketEvent): PredictionRecurrence | undefined {
    const classification = resolveCryptoUpDownFromEvent(event);

    switch (classification.kind) {
        case 'crypto-up-down-short':
            return classification.recurrence;
        case 'daily-up-down':
            return PredictionRecurrence.Daily;
        case 'multistrike-4h':
            return PredictionRecurrence.FourHours;
        case 'hourly-up-down':
            return PredictionRecurrence.Hour;
        case 'other':
            break;
    }

    const seriesRecurrence = event.series?.[0]?.recurrence;
    if (seriesRecurrence && isPredictionRecurrence(seriesRecurrence)) {
        return seriesRecurrence;
    }

    return;
}
