import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import { compact, uniq } from 'lodash-es';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const ParamsSchema = z.object({ userId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { userId } = await getParamsWithZodSchema(ParamsSchema, context);
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createTwitterClientV2(request);
        const { data: result, errors } = await client.v2.userTimeline(userId, {
            ...TWITTER_TIMELINE_OPTIONS,
            exclude: ['retweets'],
            pagination_token: cursor,
            max_results: limit,
        });
        if (errors?.length) logger.error('[twitter] v2.userTimeline', errors);

        const parentTweetIds = uniq(
            compact(result.data?.map((item) => item.referenced_tweets?.find((t) => t.type === 'replied_to')?.id)),
        );

        if (parentTweetIds.length > 0) {
            const parentTweetsResult = await client.v2.tweets(parentTweetIds, {
                expansions: TWITTER_TIMELINE_OPTIONS.expansions,
                'media.fields': TWITTER_TIMELINE_OPTIONS['media.fields'],
                'poll.fields': TWITTER_TIMELINE_OPTIONS['poll.fields'],
                'tweet.fields': TWITTER_TIMELINE_OPTIONS['tweet.fields'],
                'user.fields': TWITTER_TIMELINE_OPTIONS['user.fields'],
            });

            // Merge parent tweets into result.includes
            if (parentTweetsResult.includes) {
                result.includes = result.includes || {};
                const existingTweets = result.includes.tweets || [];
                const existingUsers = result.includes.users || [];
                const existingMedia = result.includes.media || [];
                const existingPolls = result.includes.polls || [];

                // Add new tweets/users/media/polls from parent tweets
                for (const tweet of parentTweetsResult.includes.tweets || []) {
                    if (!existingTweets.some((t) => t.id === tweet.id)) {
                        existingTweets.push(tweet);
                    }
                }

                for (const user of parentTweetsResult.includes.users || []) {
                    if (!existingUsers.some((u) => u.id === user.id)) existingUsers.push(user);
                }

                for (const media of parentTweetsResult.includes.media || []) {
                    if (!existingMedia.some((m) => m.media_key === media.media_key)) existingMedia.push(media);
                }

                for (const poll of parentTweetsResult.includes.polls || []) {
                    if (!existingPolls.some((p) => p.id === poll.id)) existingPolls.push(poll);
                }

                result.includes.tweets = existingTweets;
                result.includes.users = existingUsers;
                result.includes.media = existingMedia;
                result.includes.polls = existingPolls;
            }
        }

        // result.data could be undefined at runtime
        await attachRetweetedStatusToTweets(client, result.data, result.includes);
        result.data = await patchTweetsClientToFirefly(result.data || []);
        return createSuccessResponseJson(result);
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
