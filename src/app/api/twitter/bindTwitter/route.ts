import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { FIREFLY_DEV_ROOT_URL, FIREFLY_ROOT_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { encryptAes256 } from '@/services/crypto.js';
import type { NextRequestContext } from '@/types/utility.js';

const bindingSchema = z.object({
    twitter_access_token: z.string(),
    twitter_access_token_secret: z.string(),
});

export const POST = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const authorization = request.headers.get('authorization');
        if (!authorization) throw new Error('Authorization header not found');

        const parsed = bindingSchema.safeParse(await request.json());
        if (!parsed.success) throw parsed.error;

        const payload = parsed.data;
        const encrypted = encryptAes256(
            JSON.stringify({
                consumer_key: env.internal.TWITTER_CLIENT_ID,
                consumer_secret: env.internal.TWITTER_CLIENT_SECRET,
                access_token: payload.twitter_access_token,
                access_token_secret: payload.twitter_access_token_secret,
            }),
            env.internal.SESSION_CIPHER_KEY,
            env.internal.SESSION_CIPHER_IV,
        );
        const isDev = request.nextUrl.searchParams.has('dev');
        const rootUrl = isDev ? FIREFLY_DEV_ROOT_URL : FIREFLY_ROOT_URL;
        return fetchJson(urlcat(rootUrl, '/exchange/bindTwitter'), {
            method: 'POST',
            headers: {
                Authorization: authorization,
            },
            body: JSON.stringify({
                data: encrypted,
            }),
        });
    },
);
