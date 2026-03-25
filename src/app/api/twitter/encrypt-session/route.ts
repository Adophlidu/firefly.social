import { envs } from '@dimensiondev/envs';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { type TwitterMetricsData } from '@/providers/types/Firefly.js';
import { encryptAes256 } from '@/services/crypto.js';

const ParamsSchema = z.object({
    profileId: z.string(),
    encryptKey: z.string(),
});

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { profileId, encryptKey } = getSearchParamsWithZodSchema(request, ParamsSchema);

        const payload = await createTwitterSessionAfterLogin();
        if (!payload) return createErrorResponseJson('Twitter session not found', { status: 401 });

        const twitterMetricsData: TwitterMetricsData = {
            platform: SourceInURL.Twitter,
            profile_id: profileId,
            login_time: Date.now().toString(),
            client_id: payload.clientId,
            access_token: payload.accessToken,
            access_token_secret: payload.accessTokenSecret,
            consumer_key: payload.consumerKey,
            consumer_secret: payload.consumerSecret,
        };

        const encryptData = encryptAes256(
            JSON.stringify(twitterMetricsData),
            encryptKey,
            envs.external.NEXT_PUBLIC_PASSCODE_IV,
        );
        return createSuccessResponseJson(encryptData);
    },
);
