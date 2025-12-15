import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ userId: z.string() });

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { userId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.user(userId, {
            ...TWITTER_USER_OPTIONS,
        });
        if (errors?.length) {
            logger.error('[twitter] v2.user', errors);
            if (!data) return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data);
    },
);
