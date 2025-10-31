import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { SPACE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

export const GET = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const spaceId = (await context?.params)?.spaceId;
        if (!spaceId) throw new MalformedError('spaceId not found');
        const client = await createAppOnlyTwitterClientV2();
        const space = await client.v2.space(spaceId, {
            ...SPACE_OPTIONS,
        });
        return createSuccessResponseJson(space);
    },
);
