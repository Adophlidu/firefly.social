import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { type PollResponse } from '@/providers/orb/type.js';

const ParamsSchema = z.object({ postId: z.string(), profileId: z.string().optional() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { postId, profileId } = getSearchParamsWithZodSchema(request, ParamsSchema);

    const url = urlcat(ORB_POLL_ENDPOINT, '/get-voters');
    const response = await fetchOrbJson<PollResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ id: postId, myProfileId: profileId?.toLowerCase() }),
    });
    if (response.status === 'SUCCESS' && response.data) {
        response.data.isActive = Date.now() >= response.data.endTimestamp ? false : response.data.isActive;
    }
    return createResponseJsonFromOrb(response, 'Failed to get poll.');
});
