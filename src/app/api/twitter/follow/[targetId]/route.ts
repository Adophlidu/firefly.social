import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const POST = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const targetId = (await context?.params)?.targetId;
        if (!targetId) throw new MalformedError('targetId not found');

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            console.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { errors: followErrors } = await client.v2.follow(me.id, targetId);
        if (followErrors?.length) {
            console.error('[twitter] v2.follow', followErrors);
            return createTwitterErrorResponseJSON(followErrors);
        }

        return createSuccessResponseJson(true);
    },
);
