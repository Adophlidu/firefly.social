import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createErrorResponseJson, createZodErrorResponseJson } from '@/helpers/createResponseJson.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { CreatePollResponse } from '@/providers/orb/type.js';

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
    if (!lensToken) return createErrorResponseJson('No lens access token.', { status: 400 });

    const parsedData = BodySchema.safeParse(await request.json());
    if (!parsedData.success) return createZodErrorResponseJson(parsedData.error, { status: 400 });

    const url = urlcat(ORB_POLL_ENDPOINT, '/create-post');
    const response = await fetchOrbJson<CreatePollResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            publicationType: 'TEXT_ONLY',
            ...parsedData.data,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });
    return createResponseJsonFromOrb(response, 'Failed to create poll.');
});
