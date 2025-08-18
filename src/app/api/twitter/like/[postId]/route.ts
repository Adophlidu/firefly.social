import { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
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
        const postId = (await context?.params)?.postId;
        if (!postId) throw new MalformedError('postId not found');

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            console.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { errors: likeErrors } = await client.v2.like(me.id, postId);
        if (likeErrors?.length) {
            console.error('[twitter] v2.like', likeErrors);
            return createTwitterErrorResponseJSON(likeErrors);
        }

        return createSuccessResponseJson(true);
    },
);
