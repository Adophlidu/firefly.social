import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { type UserV2TimelineResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { SearchPageable } from '@/schemas/index.js';

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, query, limit } = getSearchParamsWithZodSchema(request, SearchPageable);

        const userFields = TWITTER_USER_OPTIONS['user.fields'];
        const url = urlcat('users/search', {
            query,
            'user.fields': Array.isArray(userFields) ? userFields.join(',') : undefined,
            next_token: cursor,
            max_results: limit,
        });

        const client = await createTwitterClientV2();
        const data: UserV2TimelineResult = await client.v2.get(url);

        return createSuccessResponseJson(data);
    },
);
