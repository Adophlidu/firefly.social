import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { compose } from '@/helpers/compose.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { createTwitterSessionAfterLogin } from '@/helpers/createTwitterSessionPayload.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/helpers/withTwitterRequestErrorHandler.js';
import type { TwitterMetricsData } from '@/providers/types/Firefly.js';
import { encryptMetricsData } from '@/services/encryptMetricsData.js';

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
            return createErrorResponseJSON('Twitter session not found', { status: 401 });
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

        const encryptData = encryptMetricsData(
            JSON.stringify(twitterMetricsData),
            queryParams.encryptKey,
            env.external.NEXT_PUBLIC_PASSCODE_IV,
        );

        return createSuccessResponseJSON(encryptData);
    },
);
