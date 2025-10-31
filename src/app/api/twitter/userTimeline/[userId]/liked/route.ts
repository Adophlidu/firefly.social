import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
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
        const { data: result, errors } = await client.v2.userLikedTweets(userId, {
            ...TWITTER_TIMELINE_OPTIONS,
            pagination_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
        });
        if (errors?.length) {
            console.error('[twitter] v2.userLikedTweets', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
