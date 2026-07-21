import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import z from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { CryptoPriceVariant, POLYMARKET_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { CryptoPriceHistory, PolymarketResponse } from '@/providers/prediction/polymarket/type.js';

const ParamsSchema = z.object({
    symbol: z.string(),
    variant: z.nativeEnum(CryptoPriceVariant),
    eventStartTime: z.string(),
    endDate: z.string(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.size === 0) {
        return createErrorResponseJson('Invalid Params: No parameters provided', { status: 400 });
    }

    const params = ParamsSchema.parse(Object.fromEntries(searchParams));
    const url = urlcat(POLYMARKET_API_DOMAIN, '/crypto/price-history', { ...params });
    const response = await fetchJson<PolymarketResponse<CryptoPriceHistory>>(url, {
        headers: {
            referer: 'https://polymarket.com',
        },
    });
    const result = resolvePolymarketResponse(response);

    return createSuccessResponseJson(result);
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
