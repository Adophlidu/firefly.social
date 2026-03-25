import { envs } from '@dimensiondev/envs';
import { parseJson } from '@dimensiondev/utils';
import { cookies, headers } from 'next/headers.js';
import { type NextRequest } from 'next/server.js';
import { getToken, type JWT } from 'next-auth/jwt';

import { logger } from '@/libs/Logger.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload, TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

interface TwitterAuthPayload {
    oauthToken?: string;
    oauthTokenSecret?: string;
}

export async function createTwitterSessionPayloadFromHeaders() {
    const payload = TwitterSession.payloadFromHeaders(await headers());
    if (!payload) return null;

    return TwitterSessionPayload.revealPayload(payload);
}

async function createTwitterSessionPayloadFromJWT(request: NextRequest): Promise<SessionPayload | null> {
    const token: JWT | null = await getToken({
        req: request,
        secret: envs.internal.NEXTAUTH_SECRET,
    });

    const payload = token?.twitter as TwitterAuthPayload | undefined;
    if (!payload?.oauthToken || !payload?.oauthTokenSecret) return null;

    return {
        clientId: payload.oauthToken.split('-')[0],
        consumerKey: envs.internal.TWITTER_CLIENT_ID,
        consumerSecret: envs.internal.TWITTER_CLIENT_SECRET,
        accessToken: payload.oauthToken,
        accessTokenSecret: payload.oauthTokenSecret,
    };
}

async function createTwitterSessionPayloadFromCookies() {
    const tokenFromCookie = (await cookies()).get('twitterToken');
    if (!tokenFromCookie?.value) {
        logger.warn('[createTwitterSessionPayloadFromCookies] No twitter token found in cookies');
        return null;
    }

    const token = parseJson<SessionPayload>(atob(tokenFromCookie.value));
    if (!token) {
        logger.warn('[createTwitterSessionPayloadFromCookies] Failed to parse twitter token from cookies');
        return null;
    }

    return TwitterSessionPayload.revealPayload(token);
}

export async function createTwitterSessionBeforeLogin(request: NextRequest) {
    // for api requests: retrieve session from headers
    const fromHeaders = await createTwitterSessionPayloadFromHeaders();
    if (fromHeaders) return fromHeaders;

    // before login succeed, retrieve session from JWT
    const fromJWT = await createTwitterSessionPayloadFromJWT(request);
    if (fromJWT) return fromJWT;

    return null;
}

export async function createTwitterSessionAfterLogin() {
    // for api requests: retrieve session from headers
    const fromHeaders = await createTwitterSessionPayloadFromHeaders();
    if (fromHeaders) return fromHeaders;

    // for ssr: retrieve session from cookies
    const fromCookies = await createTwitterSessionPayloadFromCookies();
    if (fromCookies) return fromCookies;

    return null;
}
