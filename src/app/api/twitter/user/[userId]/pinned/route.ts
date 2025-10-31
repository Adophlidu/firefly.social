import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';

import { MalformedError, NotFoundError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const userId = (await context?.params)?.userId;
        if (!userId) throw new MalformedError('userId not found');

        const client = await createTwitterClientV2();
        const user = await client.v2.user(userId, {
            'user.fields': ['pinned_tweet_id'],
            expansions: ['pinned_tweet_id'],
        });

        if (user.errors?.length) {
            console.error('[twitter] v2.user', user.errors);
            if (!user.data) return createTwitterErrorResponseJSON(user.errors);
        }

        if (!user.data.pinned_tweet_id) {
            throw new NotFoundError();
        }

        const {
            data,
            includes = {},
            errors,
        } = await client.v2.singleTweet(user.data.pinned_tweet_id, {
            ...TWITTER_TIMELINE_OPTIONS,
        });

        if (errors?.length) console.error('[twitter] v2.singleTweet (pinned tweet)', errors);
        if (!data) {
            console.error('[twitter] v2.singleTweet (pinned tweet) no data', user.data.pinned_tweet_id);
            throw new NotFoundError();
        }

        return createSuccessResponseJson(tweetV2ToPost(data, includes));
    },
);
