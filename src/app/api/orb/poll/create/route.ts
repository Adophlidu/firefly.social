import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/app/api/orb/poll/createResponseJsonFromOrb.js';
import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { CreatePollResult, OrbPollResponse } from '@/providers/orb/type.js';

const BodySchema = z.object({
    content: z.string(),
    poll: z.object({
        endTimestamp: z.number(),
        allowMultipleAnswers: z.boolean(),
        questions: z.array(z.string()),
    }),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const lensToken = request.headers.get('x-access-token');
    if (!lensToken) {
        return createErrorResponseJson('No lens access token.', { status: 400 });
    }

    const parsedData = BodySchema.parse(await request.json());
    const url = urlcat(ORB_POLL_ENDPOINT, '/create-post');
    const response = await fetchJson<OrbPollResponse<CreatePollResult>>(url, {
        method: 'POST',
        body: JSON.stringify({
            publicationType: 'TEXT_ONLY',
            ...parsedData,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });

    return createResponseJsonFromOrb(response, 'Failed to create poll.');
});
