import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import {
    CRYPTO_DISPLAY_NAME,
    resolveCryptoCoinFromEventListData,
} from '@/helpers/prediction/category/cryptoCoinPatterns.js';
import { selectPolymarketListMarketsForDisplay } from '@/helpers/prediction/selectPolymarketListMarketsForDisplay.js';
import { resolveCryptoUpDownFromEvent } from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

export interface PredictionCryptoCellOutcome {
    label: string;
    priceCents: string;
    /** price × 100 clamped to 0–100 — drives the 4px progress-bar segment width. */
    percent: number;
}

export interface PredictionCryptoCellSingleBody {
    variant: 'single';
    marketSlug: string;
    /** [outcome0 (green side), outcome1 (red side)] — both required for the price row + bar + buttons. */
    outcomes: [PredictionCryptoCellOutcome, PredictionCryptoCellOutcome];
}

export interface PredictionCryptoCellMultiRow {
    marketSlug: string;
    /** `groupItemTitle || question || title`, e.g. "62,200". */
    thresholdLabel: string;
    /** e.g. "62%" / "<1%". */
    winRateLabel: string;
    /** `ceil(firstPrice × 100)` clamped 0–100 — drives the green→transparent gradient width. */
    winRatePercent: number;
    /** [outcome0 (Yes, green), outcome1 (No, red)]. */
    outcomes: [string, string];
}

export interface PredictionCryptoCellMultiBody {
    variant: 'multi';
    rows: PredictionCryptoCellMultiRow[];
}

export interface PredictionCryptoCellViewModel {
    eventSlug: string;
    title: string;
    /** Resolved image src (`event.image || event.icon`). */
    image: string;
    coinLabel: string;
    isLive: boolean;
    body: PredictionCryptoCellSingleBody | PredictionCryptoCellMultiBody;
}

/** Mirrors BetItem's price formatter so the cell isn't coupled to BetItem's privates. */
const formatPriceCents = (price: string | null | undefined): string => {
    if (!price) return '50¢';
    const numPrice = Number.parseFloat(price);
    if (Number.isNaN(numPrice) || numPrice < 0 || numPrice > 1) return '50¢';
    const cents = (Math.floor(numPrice * 1000) / 10).toFixed(1);
    return `${cents}¢`;
};

/** Mirrors BetItem's win-rate formatter. */
const formatWinRate = (percentage: number): string => {
    if (percentage < 1) return '<1%';
    return `${Math.ceil(percentage)}%`;
};

const parsePrice = (price: string | undefined | null): number => {
    if (!price) return 0;
    const n = Number.parseFloat(price);
    return Number.isNaN(n) || n < 0 ? 0 : n;
};

const parsePricePercent = (price: string | undefined | null): number =>
    Math.min(100, Math.max(0, parsePrice(price) * 100));

/**
 * Build the view model for the periodic-crypto list cell (Figma 85151:45725). Returns `null` when
 * the event is not a periodic crypto Up/Down market or no coin resolves, so the caller falls back
 * to the generic `BetItem`.
 *
 * Periodic ⇔ `resolveCryptoUpDownFromEvent` classifies the slug as a known interval family
 * (5m/15m/4h/hourly/daily/multistrike) or an `isUpDownFamily` slug. `single` (`markets.length === 1`)
 * renders the Up/Down price row + buttons; `multi` renders up to 2 threshold option rows.
 */
export function formatPolymarketCryptoCellForUI(event: PolymarketEventListData): PredictionCryptoCellViewModel | null {
    const classification = resolveCryptoUpDownFromEvent(event);
    const isPeriodic = classification.kind !== 'other' || classification.isUpDownFamily;
    if (!isPeriodic) return null;

    const coin = resolveCryptoCoinFromEventListData(event);
    if (!coin) return null;

    const formatted = formatPolymarketEventListData(event);
    const markets = formatted.markets;
    if (!markets.length) return null;

    const coinLabel = CRYPTO_DISPLAY_NAME[coin];
    const isLive = formatted.status === 'active' && !formatted.closed;
    const eventSlug = formatted.slug || event.id;
    const image = formatted.image || formatted.icon || '';

    if (markets.length === 1) {
        const market = markets[0];
        const o0 = market.outcomes[0];
        const o1 = market.outcomes[1];
        if (!o0 || !o1) return null;
        const outcomes: [PredictionCryptoCellOutcome, PredictionCryptoCellOutcome] = [
            { label: o0.label, priceCents: formatPriceCents(o0.price), percent: parsePricePercent(o0.price) },
            { label: o1.label, priceCents: formatPriceCents(o1.price), percent: parsePricePercent(o1.price) },
        ];
        return {
            eventSlug,
            title: formatted.title,
            image,
            coinLabel,
            isLive,
            body: { variant: 'single', marketSlug: market.slug ?? '', outcomes },
        };
    }

    const selected = selectPolymarketListMarketsForDisplay(markets, formatted.sortBy, 2);
    const rows: PredictionCryptoCellMultiRow[] = selected.map((market) => {
        const o0 = market.outcomes[0];
        const o1 = market.outcomes[1];
        const firstPercentage = parsePricePercent(o0?.price);
        return {
            marketSlug: market.slug ?? '',
            thresholdLabel: market.groupItemTitle || market.question || market.title,
            winRateLabel: formatWinRate(firstPercentage),
            winRatePercent: Math.min(100, Math.max(0, Math.ceil(firstPercentage))),
            outcomes: [o0?.label ?? 'Yes', o1?.label ?? 'No'] as [string, string],
        };
    });
    if (!rows.length) return null;

    return {
        eventSlug,
        title: formatted.title,
        image,
        coinLabel,
        isLive,
        body: { variant: 'multi', rows },
    };
}
