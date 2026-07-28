import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getThreadTweets } from '@/helpers/getThreadTweets.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { attachRetweetedStatusToTweets } from '@/providers/twitter/attachRetweetedStatusToTweets.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { tweetV2ToPost } from '@/providers/twitter/formatTwitterPost.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ tweetId: z.string() });

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2(request);
        const { data, includes, errors } = await getThreadTweets(client, tweetId);
        if (errors?.length) logger.error('[twitter] v2.tweets', errors);
        await attachRetweetedStatusToTweets(client, data, includes);

        return createSuccessResponseJson(data.map((tweet) => tweetV2ToPost(tweet, includes)));
    },
);

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
