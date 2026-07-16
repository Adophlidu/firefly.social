import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { resolveCryptoCoinLabelFromEventListData } from '@/helpers/prediction/category/cryptoCoinPatterns.js';
import {
    isMarketDecided,
    selectPolymarketListMarketsForDisplay,
} from '@/helpers/prediction/selectPolymarketListMarketsForDisplay.js';
import { resolveCryptoUpDownFromEvent } from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

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
 * View model for the periodic-crypto list cell (Figma 85151:45725). Returns `null` (→ caller falls
 * back to `BetItem`) unless the event is crypto AND periodic: a known interval slug
 * (5m/15m/4h/hourly/daily/multistrike/up-down) OR a crypto multi-market threshold event
 * ("What price will BTC hit", "BTC closes above"). "Crypto" = a known coin (BTC/ETH/SOL/…) OR any
 * event Polymarket tags `crypto` / `crypto-prices` — that admits the long tail of hit-price markets
 * (Hyperliquid, Chainlink, …) while keeping stocks/commodities (tagged `finance`) on `BetItem`.
 */
export function formatPolymarketCryptoCellForUI(event: PolymarketEventListData): PredictionCryptoCellViewModel | null {
    const classification = resolveCryptoUpDownFromEvent(event);
    const coinLabel = resolveCryptoCoinLabelFromEventListData(event);
    if (!coinLabel) return null;

    const isSlugPeriodic = classification.kind !== 'other' || classification.isUpDownFamily;
    const isCryptoThresholdMulti = event.markets.length > 1 && event.markets.some((market) => !!market.groupItemTitle);
    if (!isSlugPeriodic && !isCryptoThresholdMulti) return null;

    const formatted = formatPolymarketEventListData(event);
    const markets = formatted.markets;
    if (!markets.length) return null;
    // Follow market state, not the event-level `closed` flag (which lags recurring cycles): live
    // while any market is active, open, unresolved, and not decided.
    const isMarketTradable = (market: BetsMarketDataForUI): boolean =>
        market.active !== false && !market.isClosed && !market.isResolved && !isMarketDecided(market);
    const isLive = markets.some(isMarketTradable);
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

    // Show the top-2 options excluding 100%: drop markets whose Yes price renders as 100%
    // (ceil >= 100), not just price >= 1, so e.g. 0.9995 doesn't sneak in as a 100% row.
    const notRenderedAsFullPercent = (market: BetsMarketDataForUI): boolean =>
        Math.ceil(parsePrice(market.outcomes[0]?.price) * 100) < 100;
    const selected = selectPolymarketListMarketsForDisplay(
        markets.filter(notRenderedAsFullPercent),
        formatted.sortBy,
        2,
    );
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
