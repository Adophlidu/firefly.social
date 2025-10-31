import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { TWITTER_USER_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

const BodySchema = z.object({
    ids: z.array(z.string()).min(1),
});

export const POST = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const parsedBody = BodySchema.safeParse(await request.json());
        if (!parsedBody.success) throw parsedBody.error;
        const { ids } = parsedBody.data;

        const client = await createTwitterClientV2();
        const { data, errors } = await client.v2.users(ids, {
            ...TWITTER_USER_OPTIONS,
        });
        if (errors?.length) console.error('[twitter] v2.users', errors);

        return createSuccessResponseJson(data);
    },
);
