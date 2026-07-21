import { ORB_API_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { PollSignInResponse } from '@/providers/orb/type.js';

const BodySchema = z.object({
    secret: z.string().min(1),
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { secret } = await getJsonBodyWithZodSchema(request, BodySchema);

    const url = urlcat(ORB_API_URL, '/poll-sign-in');
    const response = await fetchOrbJson<PollSignInResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            secret,
        }),
    });
    return createResponseJsonFromOrb(response, 'Failed to poll sign in orb');
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
