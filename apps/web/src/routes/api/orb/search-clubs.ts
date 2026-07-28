import { ORB_QUERIES_API_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { SearchClubsResponse } from '@/providers/orb/type.js';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No lens access token.'),
});

const ParamsSchema = z.object({
    q: z.string().min(1),
    skip: z.coerce.number().default(0),
    limit: z.coerce.number().default(50),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { 'x-access-token': lensToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const { q, skip, limit } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    const response = await fetchOrbJson<SearchClubsResponse>(urlcat(ORB_QUERIES_API_URL, '/search'), {
        method: 'POST',
        body: JSON.stringify({
            query: q,
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

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
