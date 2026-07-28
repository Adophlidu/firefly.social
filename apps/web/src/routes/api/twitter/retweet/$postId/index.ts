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

const ParamsSchema = z.object({ postId: z.string() });

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { postId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            logger.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { errors: retweetErrors } = await client.v2.retweet(me.id, postId);
        if (retweetErrors?.length) {
            // Tolerate "already retweeted" error - treat as success
            const alreadyRetweetedError = retweetErrors.find((error) =>
                error.detail?.includes('You have already retweeted'),
            );
            if (alreadyRetweetedError && retweetErrors.length === 1) {
                return createSuccessResponseJson(true);
            }
            logger.error('[twitter] v2.retweet', retweetErrors);
            return createTwitterErrorResponseJSON(retweetErrors);
        }

        return createSuccessResponseJson(true);
    },
);

export function POST({ request, params }: ApiContext) {
    return postHandler(request as NextRequest, { params } as never);
}
