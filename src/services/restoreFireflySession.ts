import { safeUnreachable } from '@masknet/kit';
import urlcat from 'urlcat';

import { NotAllowedError, TimeoutError, UnreachableError } from '@/constants/error.js';
import { NOT_DEPEND_SECRET, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getDidServiceHost } from '@/helpers/getDidServiceHost.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { LoginResponse } from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';
import type { ResponseJSON } from '@/types/index.js';

async function restoreFireflySessionFromLens(session: LensSession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/lens/login');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            accessToken: session.token,
        }),
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromFarcaster(session: FarcasterSession, signal?: AbortSignal) {
    const isGrantByPermission = FarcasterSession.isGrantByPermission(session, true);
    const isRelayService = FarcasterSession.isRelayService(session);
    if (!isGrantByPermission && !isRelayService)
        throw new NotAllowedError(
            '[restoreFireflySession] Only grant-by-permission or relay service sessions are allowed.',
        );

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/farcaster/login');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: isGrantByPermission ? session.signerRequestToken : undefined,
            channelToken: isRelayService ? session.channelToken : undefined,
        }),
        signal,
    });

    const json: LoginResponse = await response.json();
    if (!response.ok && json.error?.includes('Farcaster login timed out'))
        throw new TimeoutError('[restoreFireflySession] Farcaster login timed out.');

    const data = resolveFireflyResponseData(json);
    if (data.fid && data.accountId && data.accessToken) {
        // overwrite the profile id and signer token
        const farcasterSession = session as FarcasterSession;
        farcasterSession.profileId = `${data.fid}`;
        if (data.farcaster_signer_private_key) {
            farcasterSession.signerRequestToken = FAKE_SIGNER_REQUEST_TOKEN;
            farcasterSession.token = data.farcaster_signer_private_key;
        } else {
            console.warn(`[restoreFireflySession] No farcaster signer keys found in the response.`);
        }

        return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
    }
    throw new Error('[restoreFireflySession] Failed to restore firefly session.');
}

async function restoreFireflySessionFromTwitter(session: TwitterSession, signal?: AbortSignal) {
    // encrypt twitter session
    const encrypted = await fetchJSON<ResponseJSON<string>>('/api/twitter/auth', {
        method: 'POST',
        headers: TwitterSession.payloadToHeaders(session.payload),
        signal,
    });
    if (!encrypted.success)
        throw new Error(`[restoreFireflySession] Failed to encrypt twitter session: ${encrypted.error.message}.`);

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/exchange/twitter');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            data: encrypted.data,
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromBsky(session: BskySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/bsky/login');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            did: session.did,
            token: session.sessionPayload.accessJwt,
            serviceEndpoint: getDidServiceHost(session.sessionPayload.didDoc),
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromApple(session: ThirdPartySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/apple/login');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            authorizationToken: session.token,
            nonce: session.payload?.nonce,
        }),
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromGoogle(session: ThirdPartySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/google/login');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            idToken: session.token,
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromTelegram(session: ThirdPartySession, signal?: AbortSignal) {
    if (!session.payload?.accountId || !session.payload.accessToken) throw new NotAllowedError();

    return new FireflySession(
        session.payload.accountId,
        session.payload.accessToken,
        session,
        null,
        false,
        session.payload,
    );
}

async function restoreFireflySessionFromEmail(session: ThirdPartySession, signal?: AbortSignal) {
    if (!session.payload?.email || !session.payload?.passcode) throw new Error('Email and passcode are required.');
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/email/login');
    const response = await fetchJSON<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            email: session.payload.email,
            otp: session.payload.passcode,
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);

    if (session.profileId === NOT_DEPEND_SECRET) {
        session.profileId = data.accountId;
        session.token = data.accessToken;
        session.payload = {
            ...session.payload,
            accountId: data.accountId,
            accessToken: data.accessToken,
        };
    }

    return new FireflySession(data.accountId, data.accessToken, session, null, false, data);
}

/**
 * Restore firefly session from a lens or farcaster session.
 * @param session
 * @param signal
 * @returns
 */
export function restoreFireflySession(session: Session, signal?: AbortSignal) {
    switch (session.type) {
        case SessionType.Lens:
            return restoreFireflySessionFromLens(session as LensSession, signal);
        case SessionType.Farcaster:
            return restoreFireflySessionFromFarcaster(session as FarcasterSession, signal);
        case SessionType.Twitter:
            return restoreFireflySessionFromTwitter(session as TwitterSession, signal);
        case SessionType.Bsky:
            return restoreFireflySessionFromBsky(session as BskySession, signal);
        case SessionType.Apple:
            return restoreFireflySessionFromApple(session as ThirdPartySession, signal);
        case SessionType.Google:
            return restoreFireflySessionFromGoogle(session as ThirdPartySession, signal);
        case SessionType.Telegram:
            return restoreFireflySessionFromTelegram(session as ThirdPartySession, signal);
        case SessionType.Firefly:
            throw new NotAllowedError('[restoreFireflySession] Firefly session is not allowed.');
        case SessionType.Email:
            return restoreFireflySessionFromEmail(session as ThirdPartySession, signal);
        default:
            safeUnreachable(session.type);
            throw new UnreachableError('[restoreFireflySession] session type', session.type);
    }
}

/**
 * Restore firefly session from all social sources.
 * @returns
 */
export async function restoreFireflySessionAll() {
    for (const source of SORTED_SOCIAL_SOURCES) {
        const holder = resolveSessionHolder(source);
        if (!holder?.session) continue;

        const fireflySession = await restoreFireflySession(holder.session);
        if (!fireflySession) continue;

        return fireflySession;
    }
    return null;
}
