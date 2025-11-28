import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { SPACE_OPTIONS } from '@/constants/twitter.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createAppOnlyTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ spaceId: z.string() });

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { spaceId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createAppOnlyTwitterClientV2();
        const space = await client.v2.space(spaceId, {
            ...SPACE_OPTIONS,
        });
        return createSuccessResponseJson(space);
    },
);
