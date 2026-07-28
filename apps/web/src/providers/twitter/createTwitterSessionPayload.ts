import { envs } from '@dimensiondev/envs/web';
import { parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { getToken, type JWT } from 'next-auth/jwt';

import { logger } from '@/libs/Logger.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload, TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

interface TwitterAuthPayload {
    oauthToken?: string;
    oauthTokenSecret?: string;
}

/**
 * Session-from-headers works on any runtime: callers either pass the
 * request's headers (Workers/SSR library) or rely on next/headers (the old
 * Next app, when omitted).
 */
export async function createTwitterSessionPayloadFromHeaders(rawHeaders?: Headers) {
    const resolvedHeaders = rawHeaders ?? (await import('next/headers.js')).headers();
    const payload = TwitterSession.payloadFromHeaders(await resolvedHeaders);
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
    const token: JWT | null = await getToken({
        req: request,
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

async function createTwitterSessionPayloadFromCookies(request?: Request) {
    const tokenValue = request
        ? parseCookieHeader(request, 'twitterToken')
        : (await (await import('next/headers.js')).cookies()).get('twitterToken')?.value;
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

/**
 * `request`-optional: the SSR library's API routes pass the incoming Request
 * (Workers-safe); the old Next app calls without arguments and the session
 * comes from next/headers.
 */
export async function createTwitterSessionAfterLogin(request?: Request) {
    // for api requests: retrieve session from headers
    const fromHeaders = await createTwitterSessionPayloadFromHeaders(request?.headers);
    if (fromHeaders) return fromHeaders;

    // for ssr: retrieve session from cookies
    const fromCookies = await createTwitterSessionPayloadFromCookies(request);
    if (fromCookies) return fromCookies;

    return null;
}
