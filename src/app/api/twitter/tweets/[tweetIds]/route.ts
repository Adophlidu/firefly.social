import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { TWITTER_TIMELINE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { patchTweetsClientToFirefly } from '@/helpers/patchPostClientToFirefly.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({
    tweetIds: z.string().transform((val) => val.split(',').filter(Boolean)),
});

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { tweetIds } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2();
        const result = await client.v2.tweets(tweetIds, TWITTER_TIMELINE_OPTIONS);
        result.data = await patchTweetsClientToFirefly(result.data);
        return createSuccessResponseJson(result);
    },
);
