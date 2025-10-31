import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { encodeAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionBeforeLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const payload = await createTwitterSessionBeforeLogin(request);
        if (!payload) return createSuccessResponseJson(null);

        const data = await TwitterSessionPayload.concealPayload(payload);
        return createSuccessResponseJson(data, {
            headers: {
                'Set-Cookie': `twitterToken=${encodeAsciiPayload(data)}; path=/; Max-Age=31536000; SameSite=Lax; Secure;}`,
            },
        });
    },
);
