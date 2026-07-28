import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { VoteResultResponse } from '@/providers/orb/type.js';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No lens access token.'),
});

const BodySchema = z.object({
    postId: z.string(),
    pollOptions: z.array(z.number()).max(10, 'Maximum 10 poll options allowed'),
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { 'x-access-token': lensToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const { postId, pollOptions } = await getJsonBodyWithZodSchema(request, BodySchema);

    const url = urlcat(ORB_POLL_ENDPOINT, '/enable-action');
    const response = await fetchOrbJson<VoteResultResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            task: 'POLL',
            post: postId,
            pollOptions,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });
    return createResponseJsonFromOrb(response, 'Failed to vote.');
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
