import { UnauthorizedError } from '@dimensiondev/utils';
import { TwitterApi } from 'twitter-api-v2';

import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';

export interface TwitterUserContextClient extends TwitterApi {
    viewerId: string;
}

// OAuth 1.0a (User context)
export async function createTwitterClientV2() {
    const payload = await createTwitterSessionAfterLogin();
    if (!payload) throw new UnauthorizedError();

    const client = new TwitterApi({
        appKey: payload.consumerKey,
        appSecret: payload.consumerSecret,
        accessToken: payload.accessToken,
        accessSecret: payload.accessTokenSecret,
    });

    return Object.assign(client, {
        viewerId: payload.clientId,
    }) as TwitterUserContextClient;
}

// OAuth2 (app-only or user context)
export async function createAppOnlyTwitterClientV2() {
    const client = await createTwitterClientV2();
    return client.appLogin();
}
