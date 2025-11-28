import { compose } from '@dimensiondev/utils';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/index.js';

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { cursor, limit } = getSearchParamsWithZodSchema(request, Pageable);

        const client = await createTwitterClientV2();
        const { data: result, errors } = await client.v2.homeTimeline({
            ...TWITTER_TIMELINE_OPTIONS,
            pagination_token: cursor,
            max_results: limit,
        });

        if (errors?.length) console.error('[twitter] v2.homeTimeline', errors);

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
