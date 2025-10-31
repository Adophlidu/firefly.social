import { compose } from '@dimensiondev/utils';
import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { TwitterMetricsData } from '@/providers/types/Firefly.js';
import { encryptAes256 } from '@/services/crypto.js';

const SearchPageable = z.object({
    profileId: z.string(),
    encryptKey: z.string(),
});

export const GET = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsFromRequestWithZodObject(request, SearchPageable);

        const payload = await createTwitterSessionAfterLogin();
        if (!payload) {
            return createErrorResponseJson('Twitter session not found', { status: 401 });
        }

        const twitterMetricsData: TwitterMetricsData = {
            platform: SourceInURL.Twitter,
            profile_id: queryParams.profileId,
            login_time: Date.now().toString(),
            client_id: payload.clientId,
            access_token: payload.accessToken,
            access_token_secret: payload.accessTokenSecret,
            consumer_key: payload.consumerKey,
            consumer_secret: payload.consumerSecret,
        };

        const encryptData = encryptAes256(
            JSON.stringify(twitterMetricsData),
            queryParams.encryptKey,
            env.external.NEXT_PUBLIC_PASSCODE_IV,
        );

        return createSuccessResponseJson(encryptData);
    },
);
