import { safeUnreachable } from '@masknet/kit';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { NotAllowedError, TimeoutError, UnreachableError } from '@/constants/error.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
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
import type { LoginResponse, ThirdPartyLoginResponse } from '@/providers/types/Firefly.js';
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
    return new FireflySession(data.accountId, data.accessToken, session, null, data.isNew);
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

        return new FireflySession(data.accountId, data.accessToken, session, null, data.isNew);
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
    return new FireflySession(data.accountId, data.accessToken, session, null, data.isNew);
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
    return new FireflySession(data.accountId, data.accessToken, session, null, data.isNew);
}

async function restoreFireflySessionFromApple(session: ThirdPartySession, signal?: AbortSignal) {
    const appleSession = session as ThirdPartySession;
    const appleUrl = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/apple/login');
    const appleResponse = await fetchJSON<ThirdPartyLoginResponse>(appleUrl, {
        method: 'POST',
        body: JSON.stringify({
            authorizationToken: appleSession.token,
            nonce: appleSession.payload?.nonce,
        }),
        signal,
    });
    const appleData = resolveFireflyResponseData(appleResponse);
    return new FireflySession(appleData.accountId, appleData.accessToken, session, null, appleData.isNew);
}

async function restoreFireflySessionFromGoogle(session: ThirdPartySession, signal?: AbortSignal) {
    const googleSession = session as ThirdPartySession;
    const googleUrl = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/google/login');
    const googleResponse = await fetchJSON<ThirdPartyLoginResponse>(googleUrl, {
        method: 'POST',
        body: JSON.stringify({
            idToken: googleSession.token,
        }),
        signal,
    });

    const googleData = resolveFireflyResponseData(googleResponse);
    return new FireflySession(googleData.accountId, googleData.accessToken, session, null, googleData.isNew);
}

async function restoreFireflySessionFromEmail(session: ThirdPartySession, signal?: AbortSignal) {
    return new FireflySession(session.profileId, session.token, session, null, session.payload?.isNew);
}

async function restoreFireflySessionFromTelegram(session: ThirdPartySession, signal?: AbortSignal) {
    const tgSession = session as ThirdPartySession;
    if (!tgSession.payload?.accountId || !tgSession.payload.accessToken) throw new NotAllowedError();
    return new FireflySession(
        tgSession.payload.accountId,
        tgSession.payload.accessToken,
        session,
        null,
        tgSession.payload.isNew,
    );
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
        // we don't support twitter for now
        if (source === Source.Twitter) continue;

        const holder = resolveSessionHolder(source);
        if (!holder?.session) continue;

        const fireflySession = await restoreFireflySession(holder.session);
        if (!fireflySession) continue;

        return fireflySession;
    }
    return null;
}
