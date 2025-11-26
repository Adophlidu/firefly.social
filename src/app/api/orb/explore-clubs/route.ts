import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_API_URL } from '@/constants/index.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import type { ExploreClubsResponse } from '@/providers/orb/type.js';

const ParamsSchema = z.object({
    category: z.enum(['TRENDING_CLUBS']),
    skip: z.coerce.number().default(0),
    limit: z.coerce.number().default(20),
});

export async function GET(request: NextRequest) {
    const { category, skip, limit } = getSearchParamsFromRequestWithZodObject(request, ParamsSchema);

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
}
