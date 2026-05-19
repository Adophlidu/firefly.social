import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { PastResultsRequest } from '@/helpers/prediction/polymarket/eventSeriesPills/buildPastResultsParams.js';
import type { PastResultsData } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { ResponseJson } from '@/types/utility.js';

const MAX_GET_QUERY_LENGTH = 6000;

function buildQueryPayload(request: PastResultsRequest): Record<string, string | string[]> {
    const { symbolParams, includeOutcomesBySlug, outcomesOnly, pastEventSlugs } = request;
    const payload: Record<string, string | string[]> = {};

    if (symbolParams) {
        payload.symbol = symbolParams.symbol;
        payload.variant = symbolParams.variant;
        payload.assetType = symbolParams.assetType;
        payload.currentEventStartTime = symbolParams.currentEventStartTime;
        if (symbolParams.endDate) payload.endDate = symbolParams.endDate;
        payload.count = String(symbolParams.count);
    }

    if (includeOutcomesBySlug) payload.includeOutcomesBySlug = 'true';
    if (outcomesOnly) payload.outcomesOnly = 'true';
    if (pastEventSlugs.length) payload.pastEventSlugs = pastEventSlugs;

    return payload;
}

export async function getPolymarketPastResults(request: PastResultsRequest): Promise<PastResultsData | null> {
    const payload = buildQueryPayload(request);

    if (!request.symbolParams && !request.outcomesOnly) {
        return null;
    }

    const queryString = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
        if (Array.isArray(value)) {
            for (const item of value) queryString.append(key, item);
        } else {
            queryString.set(key, value);
        }
    }

    try {
        if (queryString.toString().length <= MAX_GET_QUERY_LENGTH) {
            const url = urlcat('/api/polymarket/past-results', Object.fromEntries(queryString.entries()));
            const response = await fetchJson<ResponseJson<PastResultsData>>(url);
            return resolveResponseData(response) ?? null;
        }

        const response = await fetchJson<ResponseJson<PastResultsData>>('/api/polymarket/past-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...(request.symbolParams
                    ? {
                          symbol: request.symbolParams.symbol,
                          variant: request.symbolParams.variant,
                          assetType: request.symbolParams.assetType,
                          currentEventStartTime: request.symbolParams.currentEventStartTime,
                          endDate: request.symbolParams.endDate,
                          count: request.symbolParams.count,
                      }
                    : {}),
                includeOutcomesBySlug: request.includeOutcomesBySlug || undefined,
                outcomesOnly: request.outcomesOnly || undefined,
                pastEventSlugs: request.pastEventSlugs,
            }),
        });
        return resolveResponseData(response) ?? null;
    } catch {
        return null;
    }
}
