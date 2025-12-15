import { compose } from '@dimensiondev/utils';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createTwitterClientV2();
        const { data: result, errors } = await client.v2.bookmarks({
            max_results: limit,
            pagination_token: cursor,
        });
        if (errors?.length) {
            logger.error('[twitter] v2.bookmarks', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
