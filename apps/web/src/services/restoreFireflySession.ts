import { SessionType } from '@dimensiondev/enums';
import { NotAllowedError, safeUnreachable, TimeoutError, UnreachableError } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { LoginEmailError } from '@/constants/error.js';
import { NOT_DEPEND_SECRET } from '@/constants/static.js';
import { fetch } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { getPdsServiceHostFromSession } from '@/providers/bsky/getPdsServiceUrlFromSession.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { patchFarcasterSessionRequired } from '@/providers/farcaster/patchFarcasterSessionRequired.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { loginTelegram } from '@/providers/firefly/auth/loginTelegram.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { LoginResponse } from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

async function restoreFireflySessionFromLens(session: LensSession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/lens/login');
    const response = await fetchJson<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            accessToken: session.token,
            version: 'v3',
        }),
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return new FireflySession(data?.uid ?? data.accountId, data.accessToken, session, null, false, data);
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
        patchFarcasterSessionRequired(session as FarcasterSession, data.fid, data.farcaster_signer_private_key);
        return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
    }
    throw new Error('[restoreFireflySession] Failed to restore firefly session.');
}

async function restoreFireflySessionFromTwitter(session: TwitterSession, signal?: AbortSignal) {
    const encryptedResponse = await fetchJson<ResponseJson<string>>('/api/twitter/auth', {
        method: 'POST',
        headers: TwitterSession.payloadToHeaders(session.payload),
        signal,
    });
    const encrypted = resolveTwitterResponseData(
        encryptedResponse,
        '[restoreFireflySession] Failed to encrypt twitter session.',
    );

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/exchange/twitter');
    const response = await fetchJson<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            data: encrypted,
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromBsky(session: BskySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/bsky/login');
    const response = await fetchJson<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            did: session.did,
            token: session.sessionPayload.accessJwt,
            serviceEndpoint: getPdsServiceHostFromSession(session),
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromApple(session: ThirdPartySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/apple/login');
    const response = await fetchJson<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            authorizationToken: session.token,
            nonce: session.payload?.nonce,
        }),
        signal,
    });
    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromGoogle(session: ThirdPartySession, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/google/login');
    const response = await fetchJson<LoginResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            idToken: session.token,
        }),
        signal,
    });

    const data = resolveFireflyResponseData(response);
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromTelegram(session: ThirdPartySession, signal?: AbortSignal) {
    const data = await loginTelegram(session.token);
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
}

async function restoreFireflySessionFromEmail(session: ThirdPartySession, signal?: AbortSignal) {
    if (!session.payload?.email || !session.payload?.passcode) throw new Error('Email and passcode are required.');
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/email/login');
    const response = await fetchJson<LoginResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                email: session.payload.email,
                otp: session.payload.passcode,
            }),
            signal,
        },
        { noStrictOK: true },
    );

    if (response.code === 1639) throw new LoginEmailError(first(response.error));

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
    return new FireflySession(data.uid ?? data.accountId, data.accessToken, session, null, false, data);
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
