import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';

export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, Pageable);

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) console.error('[twitter] v2.me', errors);

        const { data, errors: muteErrors } = await client.v2.userMutingUsers(me.id, {
            ...TWITTER_USER_OPTIONS,
            pagination_token: queryParams.cursor ? queryParams.cursor : undefined,
            max_results: queryParams.limit,
        });
        if (muteErrors?.length) console.error('[twitter] v2.userMutingUsers', muteErrors);

        return createSuccessResponseJson(data);
    },
);
