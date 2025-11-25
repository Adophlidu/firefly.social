import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createErrorResponseJson, createZodErrorResponseJson } from '@/helpers/createResponseJson.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { VoteResultResponse } from '@/providers/orb/type.js';

const BodySchema = z.object({
    postId: z.string(),
    pollOptions: z.array(z.number()),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const lensToken = request.headers.get('x-access-token');
    if (!lensToken) return createErrorResponseJson('No lens access token.', { status: 400 });

    const parsedData = BodySchema.safeParse(await request.json());
    if (!parsedData.success) return createZodErrorResponseJson(parsedData.error, { status: 400 });

    const url = urlcat(ORB_POLL_ENDPOINT, '/enable-action');
    const response = await fetchOrbJson<VoteResultResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            task: 'POLL',
            post: parsedData.data.postId,
            pollOptions: parsedData.data.pollOptions,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });
    return createResponseJsonFromOrb(response, 'Failed to vote.');
});
