import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import type { UserV2TimelineResult } from 'twitter-api-v2';
import urlcat from 'urlcat';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

const SearchPageable = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.coerce
        .number()
        .default(25)
        .refine((value) => {
            if (value) z.coerce.number().int().min(1).parse(value);
            return true;
        }),
});

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, SearchPageable);

        const userFields = TWITTER_USER_OPTIONS['user.fields'];
        const url = urlcat('users/search', {
            query: queryParams.query,
            'user.fields': Array.isArray(userFields) ? userFields.join(',') : undefined,
            next_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
        });

        const client = await createTwitterClientV2();
        const data: UserV2TimelineResult = await client.v2.get(url);

        return createSuccessResponseJson(data);
    },
);
