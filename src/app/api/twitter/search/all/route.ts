import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { SearchPageable } from '@/schemas/index.js';

function removeUnknownOperator(query: string) {
    let result = query.trimStart();

    while (/^[`~!%^&*()_+<>?:"{},./;'[\]]/im.test(result)) {
        result = result.slice(1);
    }

    return result;
}

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, limit, query } = getSearchParamsWithZodSchema(request, SearchPageable);

        const client = await createAppOnlyTwitterClientV2();
        const { data: result, errors } = await client.v2.searchAll(removeUnknownOperator(query), {
            ...TWITTER_TIMELINE_OPTIONS,
            next_token: cursor,
            max_results: limit,
        });
        if (errors?.length) logger.error('[twitter] v2.search', errors);

        result.data = await patchTweetsClientToFirefly(result.data ?? []);
        return createSuccessResponseJson(result);
    },
);
