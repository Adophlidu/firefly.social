import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/app/api/orb/poll/createResponseJsonFromOrb.js';
import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { compose } from '@/helpers/compose.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { OrbPollResponse, VoteResult } from '@/providers/orb/type.js';

const BodySchema = z.object({
    postId: z.string(),
    pollOptions: z.array(z.number()),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const lensToken = request.headers.get('x-access-token');
    if (!lensToken) {
        return createErrorResponseJson('No lens access token.', { status: 400 });
    }

    const parsedData = BodySchema.parse(await request.json());
    const url = urlcat(ORB_POLL_ENDPOINT, '/enable-action');
    const response = await fetchJson<OrbPollResponse<VoteResult>>(url, {
        method: 'POST',
        body: JSON.stringify({
            task: 'POLL',
            post: parsedData.postId,
            pollOptions: parsedData.pollOptions,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });

    return createResponseJsonFromOrb(response, 'Failed to vote.');
});
