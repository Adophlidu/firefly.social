import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const PUT = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const client = await createTwitterClientV2();
        const { errors } = await client.v2.bookmark(tweetId);

        if (errors?.length) {
            console.error('[twitter] v2.bookmark', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(true);
    },
);

export const DELETE = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const client = await createTwitterClientV2();
        const { errors } = await client.v2.deleteBookmark(tweetId);

        if (errors?.length) {
            console.error('[twitter] v2.deleteBookmark', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(true);
    },
);
