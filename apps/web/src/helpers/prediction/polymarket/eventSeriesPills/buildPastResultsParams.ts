import {
    isPolymarketUpDownSlug,
    resolvePastMarketVariant,
} from '@/helpers/prediction/polymarket/eventSeriesPills/resolvePastMarketVariant.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

const ASSET_ABBREVIATIONS: Record<string, string> = {
    bitcoin: 'btc',
    btc: 'btc',
    ethereum: 'eth',
    eth: 'eth',
    solana: 'sol',
    sol: 'sol',
    dogecoin: 'doge',
    doge: 'doge',
    xrp: 'xrp',
    bnb: 'bnb',
    hype: 'hype',
};

export interface PastResultsSymbolParams {
    symbol: string;
    variant: string;
    assetType: 'crypto' | 'equity';
    currentEventStartTime: string;
    endDate: string | null;
    count: number;
}

export interface PastResultsRequestOptions {
    includeOutcomesBySlug?: boolean;
    outcomesOnly?: boolean;
    pastEventSlugs?: string[];
    count?: number;
}

export interface PastResultsRequest {
    symbolParams: PastResultsSymbolParams | null;
    includeOutcomesBySlug: boolean;
    outcomesOnly: boolean;
    pastEventSlugs: string[];
}

function getAssetAbbreviation(slug: string): string | null {
    const prefix = slug.split('-')[0]?.toLowerCase();
    if (!prefix) return null;
    return ASSET_ABBREVIATIONS[prefix] ?? prefix;
}

function isEquitySlug(slug: string): boolean {
    return /^(aapl|nvda|tsla|meta|msft|googl|amzn|nflx|pltr|open|rklb|abnb|coin|hood|qqq|spy)/.test(slug);
}

/** Build symbol/variant params for Polymarket `/api/past-results` (eO inner helper). */
export function buildPastResultsSymbolParams(
    event: SeriesEventForPills & { markets?: Array<{ eventStartTime?: string; slug?: string }> },
    count = 4,
): PastResultsSymbolParams | null {
    const slug = event.slug;
    if (!isPolymarketUpDownSlug(slug)) return null;

    const eventStartTime = event.markets?.[0]?.eventStartTime;
    if (!eventStartTime) return null;

    const variant = resolvePastMarketVariant(slug);
    if (!variant) return null;

    const abbreviation = getAssetAbbreviation(slug);
    if (!abbreviation) return null;

    const assetType: 'crypto' | 'equity' = isEquitySlug(slug) ? 'equity' : 'crypto';

    return {
        symbol: abbreviation,
        variant,
        assetType,
        currentEventStartTime: eventStartTime,
        endDate: event.endDate ?? null,
        count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 4,
    };
}

/**
 * Derive `currentEventStartTime` for past-results when not in outcomes-only mode.
 * Mirrors Polymarket `eO` memo for aligning historical windows.
 */
export function derivePastResultsCurrentEventStartTime(
    currentEvent: SeriesEventForPills & { markets?: Array<{ eventStartTime?: string }> },
    seriesEvents: SeriesEventForPills[],
    symbolParams: PastResultsSymbolParams | null,
): string | null {
    if (!currentEvent || !symbolParams) return null;

    const now = Date.now();
    const currentStart = currentEvent.markets?.[0]?.eventStartTime;
    if (!currentStart) return null;

    if (new Date(currentStart).getTime() <= now) return currentStart;

    const open = seriesEvents.filter((e) => !e.closed);
    if (!open.length) return currentStart;

    const next = [...open]
        .sort((a, b) => new Date(a.endDate ?? '').getTime() - new Date(b.endDate ?? '').getTime())
        .find((e) => new Date(e.endDate ?? '').getTime() > now);

    if (next) {
        const start = next.markets?.[0]?.eventStartTime ?? next.startTime ?? next.startDate;
        if (start) return start;
    }

    return currentStart;
}

export function buildPastResultsRequest(
    currentEvent: SeriesEventForPills & { markets?: Array<{ eventStartTime?: string }> },
    seriesEvents: SeriesEventForPills[],
    options: PastResultsRequestOptions = {},
): PastResultsRequest {
    const pastEventSlugs = [...new Set((options.pastEventSlugs ?? []).filter(Boolean))].sort();
    const includeOutcomesBySlug = options.includeOutcomesBySlug ?? false;
    const outcomesOnly = (options.outcomesOnly ?? false) && includeOutcomesBySlug;
    const symbolParams =
        outcomesOnly || !currentEvent ? null : buildPastResultsSymbolParams(currentEvent, options.count ?? 4);

    let resolvedSymbolParams = symbolParams;
    if (symbolParams && !outcomesOnly) {
        const derivedStart = derivePastResultsCurrentEventStartTime(currentEvent, seriesEvents, symbolParams);
        if (derivedStart) {
            resolvedSymbolParams = { ...symbolParams, currentEventStartTime: derivedStart };
        }
    }

    return {
        symbolParams: resolvedSymbolParams,
        includeOutcomesBySlug,
        outcomesOnly,
        pastEventSlugs,
    };
}
