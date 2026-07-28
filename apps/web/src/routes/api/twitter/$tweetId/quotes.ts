import { EMPTY_LIST } from '@dimensiondev/constants';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import type { NextRequest } from '@/compat/next-server.js';
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
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const ParamsSchema = z.object({ tweetId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const params = {
            ...TWITTER_TIMELINE_OPTIONS,
            max_results: limit,
        };

        const client = await createAppOnlyTwitterClientV2(request);

        if (cursor) {
            params.pagination_token = cursor;
        }

        const { data, errors } = await client.v2.quotes(tweetId, params);
        if (errors?.length) logger.error('[twitter] v2.search (quotes)', errors);

        // Supplement media data if insufficient by performing an additional query
        if (data.includes?.media) {
            const includesTweetIds = data.includes?.tweets
                ?.filter((x) => x.attachments?.media_keys?.length)
                ?.map((x) => x.id);
            if (includesTweetIds?.length) {
                const mediaKeys = new Set(data.includes.media.map((x) => x.media_key));
                const keySize = mediaKeys.size;
                const mediaKeysInTweets = compact(
                    data.includes?.tweets?.flatMap((tweet) => tweet.attachments?.media_keys),
                );
                mediaKeysInTweets.forEach((key) => mediaKeys.add(key));
                if (mediaKeys.size > keySize) {
                    const tweetV2LookupResult = await client.v2.tweets(includesTweetIds, TWITTER_TIMELINE_OPTIONS);
                    if (data.includes?.media && tweetV2LookupResult.includes?.media) {
                        data.includes.media = data.includes.media.concat(...tweetV2LookupResult.includes.media);
                    }
                }
            }
        }

        try {
            const retweetStatusClient = await createTwitterRetweetStatusClient(request);
            await attachRetweetedStatusToTweets(retweetStatusClient, data.data, data.includes);
        } catch (error) {
            logger.error('[twitter] attach retweeted status (quotes)', error);
        }

        return createSuccessResponseJson({
            ...data,
            data:
                data?.data?.filter((item) =>
                    item.referenced_tweets?.some((tweet) => tweet.type === 'quoted' && tweet.id === tweetId),
                ) || EMPTY_LIST,
        });
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
