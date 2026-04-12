import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_API_URL } from '@/constants/static.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { ExploreClubsResponse } from '@/providers/orb/type.js';

export const runtime = 'edge';

const ParamsSchema = z.object({
    category: z.enum(['TRENDING_CLUBS']),
    skip: z.coerce.number().default(0),
    limit: z.coerce.number().default(20),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { category, skip, limit } = getSearchParamsWithZodSchema(request, ParamsSchema);

    const url = urlcat(ORB_API_URL, '/explore-clubs');
    const response = await fetchOrbJson<ExploreClubsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            category,
            skip: `${skip}`,
            limit: `${limit}`,
        }),
        next: {
            revalidate: 60 * 60 * 1, // 1 hours
        },
    });
    return createResponseJsonFromOrb(response, 'Failed to fetch explore clubs');
});
