import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { PollResponse } from '@/providers/orb/type.js';

const ParamsSchema = z.object({ postId: z.string(), profileId: z.string().optional() });

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { postId, profileId } = ParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

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

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
