import { EMPTY_LIST } from '@dimensiondev/constants';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const ParamsSchema = z.object({ tweetId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const params: Record<string, any> = {
            ...TWITTER_USER_OPTIONS,
            max_results: limit,
        };

        const client = await createAppOnlyTwitterClientV2(request);

        if (cursor) {
            params.pagination_token = cursor;
        }

        const result = await client.v2.tweetLikedBy(tweetId, params);
        if (result.errors?.length) logger.error('[twitter] v2.tweetLikedBy', result.errors);

        return createSuccessResponseJson({
            data: result.data || EMPTY_LIST,
            meta: result.meta,
        });
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
