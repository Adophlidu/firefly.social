import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import z from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { CryptoPriceVariant, POLYMARKET_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { CryptoPrice, PolymarketResponse } from '@/providers/prediction/polymarket/type.js';

const ParamsSchema = z.object({
    symbol: z.string(),
    variant: z.nativeEnum(CryptoPriceVariant),
    eventStartTime: z.string(),
    endDate: z.string(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    if (request.nextUrl.searchParams.size === 0) {
        return new Response('Invalid Params: No parameters provided', { status: 400 });
    }

    const params = getSearchParamsWithZodSchema(request, ParamsSchema);
    const url = urlcat(POLYMARKET_API_DOMAIN, '/crypto/crypto-price', { ...params });
    const response = await fetchJson<PolymarketResponse<CryptoPrice>>(url, {
        headers: {
            referer: 'https://polymarket.com',
        },
    });
    const result = resolvePolymarketResponse(response);

    return createSuccessResponseJson(result);
});
