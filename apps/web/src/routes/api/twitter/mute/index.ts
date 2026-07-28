import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';

import type { NextRequest } from '@/compat/next-server.js';
import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createTwitterClientV2(request);
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) logger.error('[twitter] v2.me', errors);

        const { data, errors: muteErrors } = await client.v2.userMutingUsers(me.id, {
            ...TWITTER_USER_OPTIONS,
            pagination_token: cursor,
            max_results: limit,
        });
        if (muteErrors?.length) logger.error('[twitter] v2.userMutingUsers', muteErrors);

        return createSuccessResponseJson(data);
    },
);

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
