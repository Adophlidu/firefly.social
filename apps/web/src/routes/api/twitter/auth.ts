import { envs } from '@dimensiondev/envs/web';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose, UnauthorizedError } from '@dimensiondev/utils';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionBeforeLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { encryptAes256 } from '@/services/crypto.js';

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const payload = await createTwitterSessionBeforeLogin(request);
        if (!payload) throw new UnauthorizedError();

        const data = encryptAes256(
            JSON.stringify({
                consumer_key: payload.consumerKey,
                consumer_secret: payload.consumerSecret,
                access_token: payload.accessToken,
                access_token_secret: payload.accessTokenSecret,
            }),
            envs.internal.SESSION_CIPHER_KEY,
            envs.internal.SESSION_CIPHER_IV,
        );
        return createSuccessResponseJson(data);
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
