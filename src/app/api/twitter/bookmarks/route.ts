import { compose } from '@firefly/utils';
import { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';

export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, Pageable);

        const client = await createTwitterClientV2();
        const { data: result, errors } = await client.v2.bookmarks({
            max_results: queryParams.limit || 25,
            pagination_token: queryParams.cursor || undefined,
        });
        if (errors?.length) {
            console.error('[twitter] v2.bookmarks', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
