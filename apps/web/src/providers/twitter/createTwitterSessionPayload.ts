import { envs } from '@dimensiondev/envs/web';
import { parseJson } from '@dimensiondev/utils';
import { getToken, type JWT } from 'next-auth/jwt';

import type { NextRequest } from '@/compat/next-server.js';
import { logger } from '@/libs/Logger.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload, TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

interface TwitterAuthPayload {
    oauthToken?: string;
    oauthTokenSecret?: string;
}

/**
 * Session-from-headers works on any runtime: callers pass the incoming
 * request's headers.
 */
export async function createTwitterSessionPayloadFromHeaders(rawHeaders: Headers) {
    const payload = TwitterSession.payloadFromHeaders(rawHeaders);
    if (!payload) return null;

    return TwitterSessionPayload.revealPayload(payload);
}

function parseCookieHeader(request: Request, name: string): string | undefined {
    const header = request.headers.get('cookie') ?? '';
    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return decodeURIComponent(rest.join('='));
    }

    return undefined;
}

async function createTwitterSessionPayloadFromJWT(request: NextRequest): Promise<SessionPayload | null> {
    // getToken only reads the cookie header; next-auth's request type expects
    // Next.js request shapes that no longer exist in this repo.
    const token: JWT | null = await getToken({
        req: request as never,
        secret: envs.internal.NEXTAUTH_SECRET,
    });

    const payload = token?.twitter as TwitterAuthPayload | undefined;
    if (!payload?.oauthToken || !payload.oauthTokenSecret) return null;

    return {
        clientId: payload.oauthToken.split('-')[0],
        consumerKey: envs.internal.TWITTER_CLIENT_ID,
        consumerSecret: envs.internal.TWITTER_CLIENT_SECRET,
        accessToken: payload.oauthToken,
        accessTokenSecret: payload.oauthTokenSecret,
    };
}

async function createTwitterSessionPayloadFromCookies(request: Request) {
    const tokenValue = parseCookieHeader(request, 'twitterToken');
    if (!tokenValue) {
        logger.warn('[createTwitterSessionPayloadFromCookies] No twitter token found in cookies');
        return null;
    }

    const token = parseJson<SessionPayload>(atob(tokenValue));
    if (!token) {
        logger.warn('[createTwitterSessionPayloadFromCookies] Failed to parse twitter token from cookies');
        return null;
    }

    return TwitterSessionPayload.revealPayload(token);
}

export async function createTwitterSessionBeforeLogin(request: NextRequest) {
    // for api requests: retrieve session from headers
    const fromHeaders = await createTwitterSessionPayloadFromHeaders(request.headers);
    if (fromHeaders) return fromHeaders;

    // before login succeed, retrieve session from JWT
    const fromJWT = await createTwitterSessionPayloadFromJWT(request);
    if (fromJWT) return fromJWT;

    return null;
}

export async function createTwitterSessionAfterLogin(request: Request) {
    // for api requests: retrieve session from headers
    const fromHeaders = await createTwitterSessionPayloadFromHeaders(request.headers);
    if (fromHeaders) return fromHeaders;

    // for ssr: retrieve session from cookies
    const fromCookies = await createTwitterSessionPayloadFromCookies(request);
    if (fromCookies) return fromCookies;

    return null;
}
