import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { encodeAsciiPayload } from '@/helpers/encodeSessionPayload.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionBeforeLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import { subscribeWebhook } from '@/providers/twitter/subscribeWebhook.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const payload = await createTwitterSessionBeforeLogin(request);
        if (!payload) return createSuccessResponseJson(null);

        // subscribe to webhook for whitelisted user id
        subscribeWebhook(payload);

        const data = await TwitterSessionPayload.concealPayload(payload);
        return createSuccessResponseJson(data, {
            headers: {
                'Set-Cookie': `twitterToken=${encodeAsciiPayload(data)}; path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly;`,
            },
        });
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
