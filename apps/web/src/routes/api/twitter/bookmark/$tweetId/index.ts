import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ tweetId: z.string() });

const putHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const { errors } = await client.v2.bookmark(tweetId);

        if (errors?.length) {
            logger.error('[twitter] v2.bookmark', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(true);
    },
);

const deleteHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const { errors } = await client.v2.deleteBookmark(tweetId);

        if (errors?.length) {
            logger.error('[twitter] v2.deleteBookmark', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(true);
    },
);

export function PUT({ request, params }: ApiContext) {
    return putHandler(request as NextRequest, { params } as never);
}

export function DELETE({ request, params }: ApiContext) {
    return deleteHandler(request as NextRequest, { params } as never);
}
