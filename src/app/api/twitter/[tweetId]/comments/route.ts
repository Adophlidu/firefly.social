import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const tweetId = (await context?.params)?.tweetId;
        if (!tweetId) throw new MalformedError('tweetId not found');

        const queryParams = getSearchParamsFromRequestWithZodObject(request, Pageable);

        const client = await createAppOnlyTwitterClientV2();
        const { data, errors } = await client.v2.searchAll(`in_reply_to_tweet_id:${tweetId}`, {
            ...TWITTER_TIMELINE_OPTIONS,
            next_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
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
