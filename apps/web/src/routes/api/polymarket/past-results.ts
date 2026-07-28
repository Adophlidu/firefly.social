import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import z from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { POLYMARKET_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';

const POLYMARKET_HEADERS = {
    referer: 'https://polymarket.com',
} as const;

const SymbolParamsSchema = z.object({
    symbol: z.string().optional(),
    variant: z.string().optional(),
    assetType: z.string().optional(),
    currentEventStartTime: z.string().optional(),
    endDate: z.string().optional(),
    count: z.coerce.number().int().positive().max(50).optional(),
    includeOutcomesBySlug: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    outcomesOnly: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    pastEventSlugs: z.union([z.string(), z.array(z.string())]).optional(),
});

const PostBodySchema = SymbolParamsSchema.extend({
    pastEventSlugs: z.array(z.string()).optional(),
});

function normalizePastEventSlugs(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function buildUpstreamSearchParams(input: z.infer<typeof SymbolParamsSchema>): URLSearchParams {
    const params = new URLSearchParams();
    if (input.symbol) params.set('symbol', input.symbol);
    if (input.variant) params.set('variant', input.variant);
    if (input.assetType) params.set('assetType', input.assetType);
    if (input.currentEventStartTime) params.set('currentEventStartTime', input.currentEventStartTime);
    if (input.endDate) params.set('endDate', input.endDate);
    if (input.count !== undefined) params.set('count', String(input.count));
    if (input.includeOutcomesBySlug) params.set('includeOutcomesBySlug', 'true');
    if (input.outcomesOnly) params.set('outcomesOnly', 'true');

    for (const slug of normalizePastEventSlugs(input.pastEventSlugs)) {
        params.append('pastEventSlugs', slug);
    }

    return params;
}

async function proxyPastResults(search: URLSearchParams) {
    const url = urlcat(POLYMARKET_API_DOMAIN, '/past-results', Object.fromEntries(search.entries()));
    return fetchJson(url, { headers: POLYMARKET_HEADERS });
}

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.size === 0) {
        return createErrorResponseJson('Invalid Params: No parameters provided', { status: 400 });
    }

    const input = SymbolParamsSchema.parse(Object.fromEntries(searchParams));
    const search = buildUpstreamSearchParams(input);

    try {
        const data = await proxyPastResults(search);
        return createSuccessResponseJson(data);
    } catch {
        return createErrorResponseJson('Failed to fetch past results', { status: 502 });
    }
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const body = PostBodySchema.parse(await request.json());
    const search = buildUpstreamSearchParams(body);

    try {
        const data = await proxyPastResults(search);
        return createSuccessResponseJson(data);
    } catch {
        return createErrorResponseJson('Failed to fetch past results', { status: 502 });
    }
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
