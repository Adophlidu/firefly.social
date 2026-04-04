import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { Source } from '@/constants/enum.js';
import {
    MAX_PROFILE_BIO_SIZE,
    MAX_PROFILE_DISPLAY_NAME_SIZE,
    MAX_PROFILE_LOCATION_SIZE,
    MAX_PROFILE_WEBSITE_SIZE,
} from '@/constants/limitation.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { logger } from '@/libs/Logger.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { createTwitterErrorResponseJSON } from '@/providers/twitter/createTwitterErrorResponse.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const TwitterEditProfile = z.object({
    name: z.string().min(1).max(MAX_PROFILE_DISPLAY_NAME_SIZE[Source.Twitter]).optional(),
    description: z.string().min(1).max(MAX_PROFILE_BIO_SIZE[Source.Twitter]).optional(),
    location: z.string().min(0).max(MAX_PROFILE_LOCATION_SIZE[Source.Twitter]).optional(),
    url: z.string().min(0).max(MAX_PROFILE_WEBSITE_SIZE[Source.Twitter]).optional(),
});

export const GET = compose(withTwitterRequestErrorHandler, withRequestErrorHandler(), async (request) => {
    const client = await createTwitterClientV2();
    const { data, errors } = await client.v2.me();
    if (errors?.length) {
        logger.error('[twitter] v2.me', errors);
        return createTwitterErrorResponseJSON(errors);
    }
    return createSuccessResponseJson(data);
});

export const PUT = compose(withTwitterRequestErrorHandler, withRequestErrorHandler(), async (request) => {
    const body = await getJsonBodyWithZodSchema(request, TwitterEditProfile);
    const client = await createTwitterClientV2();
    await client.v1.updateAccountProfile(body);
    return createSuccessResponseJson(null);
});
