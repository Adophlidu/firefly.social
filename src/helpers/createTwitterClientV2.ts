import type { NextRequest } from 'next/server.js';
import { TwitterApi } from 'twitter-api-v2';

import { UnauthorizedError } from '@/constants/error.js';
import { createTwitterSessionAfterLogin } from '@/helpers/createTwitterSessionPayload.js';

// OAuth 1.0a (User context)
export async function createTwitterClientV2(request: NextRequest) {
    const payload = await createTwitterSessionAfterLogin();
    if (!payload) throw new UnauthorizedError();

    return new TwitterApi({
        appKey: payload.consumerKey,
        appSecret: payload.consumerSecret,
        accessToken: payload.accessToken,
        accessSecret: payload.accessTokenSecret,
    });
}

// OAuth2 (app-only or user context)
export async function createAppOnlyTwitterClientV2(request: NextRequest) {
    const client = await createTwitterClientV2(request);
    return client.appLogin();
}
