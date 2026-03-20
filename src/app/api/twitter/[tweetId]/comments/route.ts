import { EMPTY_LIST } from '@dimensiondev/constants';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterRetweetStatusClient } from '@/providers/twitter/createTwitterRetweetStatusClient.js';
import {
    isReferencedTweetNotFoundError,
    withoutReferencedTweetExpansions,
} from '@/providers/twitter/twitterV2ErrorUtils.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const ParamsSchema = z.object({ tweetId: z.string() });

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const params = {
            ...TWITTER_TIMELINE_OPTIONS,
            max_results: limit,
        };

        const client = await createAppOnlyTwitterClientV2();

        if (cursor) {
            params.next_token = cursor;
        }

        const rawQuery = `in_reply_to_tweet_id:${tweetId}`;
        let { data, errors } = await client.v2.searchAll(rawQuery, params);

        const referencedNotFoundErrors = errors?.filter(isReferencedTweetNotFoundError) ?? [];
        const otherErrors = errors?.filter((e) => !isReferencedTweetNotFoundError(e)) ?? [];

        if (!data && referencedNotFoundErrors.length && otherErrors.length === 0) {
            const fallbackParams = withoutReferencedTweetExpansions(params);
            const fallback = await client.v2.searchAll(rawQuery, fallbackParams);
            data = fallback.data;
            errors = fallback.errors ?? errors;
        }

        const finalReferencedNotFoundErrors = errors?.filter(isReferencedTweetNotFoundError) ?? [];
        const finalOtherErrors = errors?.filter((e) => !isReferencedTweetNotFoundError(e)) ?? [];

        if (finalOtherErrors.length) {
            logger.error('[twitter] v2.search', finalOtherErrors);
        } else if (finalReferencedNotFoundErrors.length) {
            logger.warn('[twitter] v2.search referenced tweet(s) missing (non-fatal)', finalReferencedNotFoundErrors);
        }

        const safeData = data ?? { data: [], meta: { result_count: 0 } };
        try {
            const retweetStatusClient = await createTwitterRetweetStatusClient();
            await attachRetweetedStatusToTweets(retweetStatusClient, safeData.data, safeData.includes);
        } catch (error) {
            logger.error('[twitter] attach retweeted status (comments)', error);
        }

        return createSuccessResponseJson({
            ...safeData,
            data:
                safeData.data?.filter((item) =>
                    item.referenced_tweets?.some((tweet) => tweet.type === 'replied_to' && tweet.id === tweetId),
                ) || EMPTY_LIST,
        });
    },
);
