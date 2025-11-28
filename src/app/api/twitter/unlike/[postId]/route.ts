import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ postId: z.string() });

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { postId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            console.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { errors: unlikeErrors } = await client.v2.unlike(me.id, postId);
        if (unlikeErrors?.length) {
            console.error('[twitter] v2.unlike', unlikeErrors);
            return createTwitterErrorResponseJSON(unlikeErrors);
        }

        return createSuccessResponseJson(true);
    },
);
