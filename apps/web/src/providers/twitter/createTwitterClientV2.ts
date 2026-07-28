import { UnauthorizedError } from '@dimensiondev/utils';
import { TwitterApi } from 'twitter-api-v2';

import { createTwitterSessionAfterLogin } from '@/providers/twitter/createTwitterSessionPayload.js';

export interface TwitterUserContextClient extends TwitterApi {
    viewerId: string;
}

// OAuth 1.0a (User context). `request`-optional: the SSR library's API
// routes pass the incoming Request (Workers-safe); the old Next app calls
// without arguments and the session comes from next/headers.
export async function createTwitterClientV2(request: Request) {
    const payload = await createTwitterSessionAfterLogin(request);
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
export async function createAppOnlyTwitterClientV2(request: Request) {
    const client = await createTwitterClientV2(request);
    return client.appLogin();
}
