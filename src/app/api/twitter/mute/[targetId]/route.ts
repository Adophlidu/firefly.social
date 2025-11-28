import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ targetId: z.string() });

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { targetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            console.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { data, errors: muteErrors } = await client.v2.mute(me.id, targetId);
        if (muteErrors?.length) {
            console.error('[twitter] v2.mute', muteErrors);
            return createTwitterErrorResponseJSON(muteErrors);
        }

        return createSuccessResponseJson(data);
    },
);

export const DELETE = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request, context) => {
        const { targetId } = await getParamsWithZodSchema(ParamsSchema, context);

        const client = await createTwitterClientV2();
        const { data: me, errors } = await client.v2.me();
        if (errors?.length) {
            console.error('[twitter] v2.me', errors);
            return createTwitterErrorResponseJSON(errors);
        }

        const { data, errors: unmuteErrors } = await client.v2.unmute(me.id, targetId);
        if (unmuteErrors?.length) {
            console.error('[twitter] v2.unmute', unmuteErrors);
            return createTwitterErrorResponseJSON(unmuteErrors);
        }

        return createSuccessResponseJson(data);
    },
);
