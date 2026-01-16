import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { EMPTY_LIST } from '@/constants/static.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
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
            params.pagination_token = cursor;
        }

        const { data, errors } = await client.v2.quotes(tweetId, params);
        if (errors?.length) logger.error('[twitter] v2.search (quotes)', errors);

        return createSuccessResponseJson({
            ...data,
            data:
                data?.data?.filter((item) =>
                    item.referenced_tweets?.some((tweet) => tweet.type === 'quoted' && tweet.id === tweetId),
                ) || EMPTY_LIST,
        });
    },
);
