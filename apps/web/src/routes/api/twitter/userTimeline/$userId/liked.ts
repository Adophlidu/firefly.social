import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const ParamsSchema = z.object({ userId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { userId } = await getParamsWithZodSchema(ParamsSchema, context);

        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createTwitterClientV2(request);
        const { data: result, errors } = await client.v2.userLikedTweets(userId, {
            ...TWITTER_TIMELINE_OPTIONS,
            pagination_token: cursor,
            max_results: limit,
        });
        if (errors?.length) {
            logger.error('[twitter] v2.userLikedTweets', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        await attachRetweetedStatusToTweets(client, result.data, result.includes);
        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
