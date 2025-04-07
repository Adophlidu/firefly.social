import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterClientV2 } from '@/helpers/createTwitterClientV2.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/index.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withRequestErrorHandler({ throwError: true }),
    withTwitterRequestErrorHandler,
    async (request, context) => {
        const tweetIds = (await context?.params)?.tweetIds?.split(',');
        if (!tweetIds) throw new MalformedError('tweetIds not found');
        const client = await createTwitterClientV2();
        const res = await client.v2.tweets(tweetIds, {
            ...TWITTER_TIMELINE_OPTIONS,
        });
        return createSuccessResponseJSON(res);
    },
);
