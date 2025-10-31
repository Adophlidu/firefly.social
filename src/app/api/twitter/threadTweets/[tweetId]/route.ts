import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getThreadTweets } from '@/helpers/getThreadTweets.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const client = await createTwitterClientV2();
        const { data, includes, errors } = await getThreadTweets(client, tweetId);
        if (errors?.length) console.error('[twitter] v2.tweets', errors);

        return createSuccessResponseJson(data.reverse().map((tweet) => tweetV2ToPost(tweet, includes)));
    },
);
