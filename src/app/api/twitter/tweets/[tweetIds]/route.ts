import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetIds = (await context?.params)?.tweetIds?.split(',');
        if (!tweetIds) throw new MalformedError('tweetIds not found');
        const client = await createTwitterClientV2();
        const result = await client.v2.tweets(tweetIds, {
            ...TWITTER_TIMELINE_OPTIONS,
        });
        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
