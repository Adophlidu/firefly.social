import { NextRequest } from 'next/server.js';

import { UnauthorizedError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionBeforeLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { encrypt } from '@/services/crypto.js';
import type { NextRequestContext } from '@/types/index.js';

export const POST = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const payload = await createTwitterSessionBeforeLogin(request);
        if (!payload) throw new UnauthorizedError();

        const data = encrypt(
            JSON.stringify({
                consumer_key: payload.consumerKey,
                consumer_secret: payload.consumerSecret,
                access_token: payload.accessToken,
                access_token_secret: payload.accessTokenSecret,
            }),
        );
        return createSuccessResponseJson(data);
    },
);
