import { ORB_API_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { ExploreClubsResponse } from '@/providers/orb/type.js';

const ParamsSchema = z.object({
    category: z.enum(['TRENDING_CLUBS']),
    skip: z.coerce.number().default(0),
    limit: z.coerce.number().default(20),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { category, skip, limit } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    const url = urlcat(ORB_API_URL, '/explore-clubs');
    const response = await fetchOrbJson<ExploreClubsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            category,
            skip: `${skip}`,
            limit: `${limit}`,
        }),
    });
    return createResponseJsonFromOrb(response, 'Failed to fetch explore clubs');
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
