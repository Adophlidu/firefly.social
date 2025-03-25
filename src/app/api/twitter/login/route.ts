import { NextRequest } from 'next/server.js';

import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterSessionBeforeLogin } from '@/helpers/createTwitterSessionPayload.js';
import { encodeAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request) => {
        const payload = await createTwitterSessionBeforeLogin(request);
        if (!payload) return createSuccessResponseJSON(null);

        const data = await TwitterSessionPayload.concealPayload(payload);
        return createSuccessResponseJSON(data, {
            headers: {
                'Set-Cookie': `twitterToken=${encodeAsciiPayload(data)}; path=/; Max-Age=31536000; SameSite=Lax; Secure;}`,
            },
        });
    },
);
