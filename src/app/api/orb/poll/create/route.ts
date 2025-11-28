import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ORB_POLL_ENDPOINT } from '@/constants/poll.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { CreatePollResponse } from '@/providers/orb/type.js';

const HeadersSchema = z.object({
    'x-access-token': z.string().min(1, 'No lens access token.'),
});

const BodySchema = z.object({
    content: z.string(),
    poll: z.object({
        endTimestamp: z.number(),
        allowMultipleAnswers: z.boolean(),
        questions: z.array(z.string()),
    }),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { 'x-access-token': lensToken } = getHeadersWithZodSchema(request, HeadersSchema);
    const body = await getJsonBodyWithZodSchema(request, BodySchema);

    const url = urlcat(ORB_POLL_ENDPOINT, '/create-post');
    const response = await fetchOrbJson<CreatePollResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            publicationType: 'TEXT_ONLY',
            ...body,
        }),
        headers: {
            'x-access-token': lensToken,
        },
    });
    return createResponseJsonFromOrb(response, 'Failed to create poll.');
});
