import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_API_URL } from '@/constants/static.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { SearchClubsResponse } from '@/providers/orb/type.js';

export const runtime = 'edge';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No lens access token.'),
});

const ParamsSchema = z.object({
    q: z.string().min(1),
    skip: z.coerce.number().default(0),
    limit: z.coerce.number().default(50),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { 'x-access-token': lensToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const { q, skip, limit } = getSearchParamsWithZodSchema(request, ParamsSchema);

    const response = await fetchOrbJson<SearchClubsResponse>(urlcat(ORB_API_URL, '/search'), {
        method: 'POST',
        body: JSON.stringify({
            searchQuery: q,
            searchType: 'GROUP',
            skip,
            limit,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });

    return createResponseJsonFromOrb(response, 'Failed to search clubs');
});
