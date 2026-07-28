import type { ApiContext } from '@dimensiondev/ssr';
import { compose, NotFoundError } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ userId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { userId } = await getParamsWithZodSchema(ParamsSchema, context);
        if (!isNumericalProfileId(userId)) {
            throw new NotFoundError('user id is not numerical');
        }

        const client = await createTwitterClientV2(request);
        const user = await client.v2.user(userId, {
            'user.fields': ['pinned_tweet_id'],
            expansions: ['pinned_tweet_id'],
        });

        if (user.errors?.length) {
            logger.error('[twitter] v2.user', user.errors);
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

        if (errors?.length) logger.error('[twitter] v2.singleTweet (pinned tweet)', errors);
        if (!data) {
            logger.error('[twitter] v2.singleTweet (pinned tweet) no data', user.data.pinned_tweet_id);
            throw new NotFoundError();
        }
        await attachRetweetedStatusToTweets(client, [data], includes);

        return createSuccessResponseJson(tweetV2ToPost(data, includes));
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
