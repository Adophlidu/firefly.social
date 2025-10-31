import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
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

        const client = await createTwitterClientV2();
        const { data: result, errors } = await client.v2.search(queryParams.query, {
            ...TWITTER_TIMELINE_OPTIONS,
            next_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
        });
        if (errors?.length) console.error('[twitter] v2.search', errors);

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
