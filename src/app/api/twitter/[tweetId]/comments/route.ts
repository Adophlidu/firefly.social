import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { EMPTY_LIST } from '@/constants/index.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';

const ParamsSchema = z.object({ tweetId: z.string() });

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createAppOnlyTwitterClientV2();
        const { data, errors } = await client.v2.searchAll(`in_reply_to_tweet_id:${tweetId}`, {
            ...TWITTER_TIMELINE_OPTIONS,
            next_token: cursor,
            max_results: limit,
        });
        if (errors?.length) console.error('[twitter] v2.search', errors);

        return createSuccessResponseJson({
            ...data,
            data:
                data?.data?.filter((item) =>
                    item.referenced_tweets?.some((tweet) => tweet.type === 'replied_to' && tweet.id === tweetId),
                ) || EMPTY_LIST,
        });
    },
);
