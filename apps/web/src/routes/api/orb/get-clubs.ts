import { ORB_API_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { GetClubsResponse } from '@/providers/orb/type.js';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No lens access token.'),
});

const ParamsSchema = z.object({
    category: z.enum(['MY_ADMIN_CLUBS', 'MY_CLUBS']),
    cursor: z.coerce.number().default(0),
    limit: z.coerce.number().default(100),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { 'x-access-token': lensToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const { category, cursor, limit } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    const response = await fetchOrbJson<GetClubsResponse>(urlcat(ORB_API_URL, '/get-clubs'), {
        method: 'POST',
        body: JSON.stringify({
            category,
            cursor: `${cursor}`,
            limit: `${limit}`,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });

    return createResponseJsonFromOrb(response, 'Failed to fetch clubs');
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
