import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyFromRequestWithZodObject } from '@/helpers/getJsonBodyFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { TwitterEditProfile } from '@/schemas/index.js';
import type { NextRequestContext } from '@/types/utility.js';

type RequestFn = (request: NextRequest, context?: NextRequestContext) => Promise<Response>;

export const GET = compose<RequestFn>(withTwitterRequestErrorHandler, withRequestErrorHandler(), async (request) => {
    const client = await createTwitterClientV2();
    const { data, errors } = await client.v2.me();
    if (errors?.length) {
        console.error('[twitter] v2.me', errors);
        return createTwitterErrorResponseJSON(errors);
    }

    return createSuccessResponseJson(data);
});

export const PUT = compose<RequestFn>(withTwitterRequestErrorHandler, withRequestErrorHandler(), async (request) => {
    const params = await getJsonBodyFromRequestWithZodObject(request, TwitterEditProfile);
    const client = await createTwitterClientV2();
    await client.v1.updateAccountProfile(params);
    return createSuccessResponseJson(null);
});
