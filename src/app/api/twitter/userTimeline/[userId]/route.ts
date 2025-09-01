import { compact } from 'lodash-es';
import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const userId = (await context?.params)?.userId;
        if (!userId) throw new MalformedError('userId not found');

        const queryParams = getSearchParamsFromRequestWithZodObject(request, Pageable);

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.userTimeline(userId, {
            ...TWITTER_TIMELINE_OPTIONS,
            pagination_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
            exclude: ['replies'],
        });
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

        if (errors?.length) console.error('[twitter] v2.userTimeline', errors);

        return createSuccessResponseJson(data);
    },
);
