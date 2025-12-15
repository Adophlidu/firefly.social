import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const BodySchema = z.object({
    ids: z.array(z.string()).min(1).max(100, 'Maximum 100 ids allowed'),
});

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { ids } = await getJsonBodyWithZodSchema(request, BodySchema);

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.users(ids, {
            ...TWITTER_USER_OPTIONS,
        });
        if (errors?.length) logger.error('[twitter] v2.users', errors);

        return createSuccessResponseJson(data);
    },
);
