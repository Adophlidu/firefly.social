import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/app/api/orb/poll/createResponseJsonFromOrb.js';
import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { compose } from '@/helpers/compose.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { OrbPoll, OrbPollResponse } from '@/providers/orb/type.js';

const searchParamsZod = z.object({ postId: z.string() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { postId } = getSearchParamsFromRequestWithZodObject(request, searchParamsZod);
    const lensToken = request.headers.get('x-access-token');
    if (!lensToken) {
        return createErrorResponseJson('No lens access token.', { status: 400 });
    }

    const url = urlcat(ORB_POLL_ENDPOINT, '/get-voters');
    const response = await fetchJson<OrbPollResponse<OrbPoll>>(url, {
        method: 'POST',
        body: JSON.stringify({ id: postId }),
        headers: {
            'x-access-token': lensToken,
        },
    });
    if (response.status === 'SUCCESS' && response.data) {
        response.data.isActive = Date.now() >= response.data.endTimestamp ? false : response.data.isActive;
    }

    return createResponseJsonFromOrb(response, 'Failed to get poll.');
});
