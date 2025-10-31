import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const userId = (await context?.params)?.userId;
        if (!userId) throw new MalformedError('userId not found');

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.user(userId, {
            ...TWITTER_USER_OPTIONS,
        });
        if (errors?.length) {
            console.error('[twitter] v2.user', errors);
            if (!data) return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data);
    },
);
