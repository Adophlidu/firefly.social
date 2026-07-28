import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { Pageable } from '@/schemas/Pageable.js';

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, limit } = Pageable.parse(Object.fromEntries(new URL(request.url).searchParams));

        const client = await createTwitterClientV2(request);
        const { data: result, errors } = await client.v2.homeTimeline({
            ...TWITTER_TIMELINE_OPTIONS,
            pagination_token: cursor,
            max_results: limit,
        });

        if (errors?.length) logger.error('[twitter] v2.homeTimeline', errors);

        try {
            await attachRetweetedStatusToTweets(client, result.data, result.includes);
        } catch (error) {
            logger.error('[twitter] attach retweeted status', error);
        }

        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
