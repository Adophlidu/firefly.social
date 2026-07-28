import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ userId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { userId } = await getParamsWithZodSchema(ParamsSchema, context);
        const isNumericalId = isNumericalProfileId(userId);

        const client = await createTwitterClientV2(request);
        const { data, errors } = !isNumericalId
            ? await client.v2.userByUsername(userId, TWITTER_USER_OPTIONS)
            : await client.v2.user(userId, TWITTER_USER_OPTIONS);
        if (errors?.length) {
            logger.error(`[twitter] ${!isNumericalId ? 'v2.userByUsername' : 'v2.user'}`, errors);
            if (!data) return createTwitterErrorResponseJSON(errors);
        }

        return createSuccessResponseJson(data);
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
