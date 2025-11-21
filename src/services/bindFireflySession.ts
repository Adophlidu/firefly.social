import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import {
    FireflyAlreadyBoundError,
    FireflyBindTimeoutError,
    NotAllowedError,
    UnreachableError,
} from '@/constants/error.js';
import { NOT_DEPEND_SECRET } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getDidServiceHost } from '@/helpers/getDidServiceHost.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { patchFarcasterSessionRequired } from '@/providers/farcaster/patchFarcasterSessionRequired.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { BindResponse } from '@/providers/types/Firefly.js';
import type { Session } from '@/providers/types/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

async function bindLensToFirefly(session: LensSession, signal?: AbortSignal) {
    const response = await fireflySessionHolder.fetch<BindResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindLens'),
        {
            method: 'POST',
            body: JSON.stringify({
                accessToken: session.token,
                isForce: false,
                version: 'v3',
            }),
            signal,
        },
    );

    if (response.error?.some((x) => x.includes('already bound to the other account'))) {
        throw new FireflyAlreadyBoundError(Source.Lens);
    }

    const data = resolveFireflyResponseData(response);
    return data;
}

async function bindFarcasterSessionToFirefly(session: FarcasterSession, signal?: AbortSignal) {
    const isGrantByPermission = FarcasterSession.isGrantByPermission(session, true);
    const isRelayService = FarcasterSession.isRelayService(session);

    if (!isGrantByPermission && !isRelayService)
        throw new NotAllowedError(
            '[bindFarcasterSessionToFirefly] Only grant-by-permission or relay service sessions are allowed.',
        );

    const response = await fireflySessionHolder.fetch<BindResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindFarcaster'),
        {
            method: 'POST',
            body: JSON.stringify({
                token: isGrantByPermission ? session.signerRequestToken : undefined,
                channelToken: isRelayService ? session.channelToken : undefined,
                isForce: false,
            }),
            signal,
        },
        {
            noStrictOK: true,
        },
    );

    if (response.error?.some((x) => x.includes('Farcaster binding timed out'))) {
        throw new FireflyBindTimeoutError(Source.Farcaster);
    }

    // If the farcaster is already bound to another account, throw an error.
    if (isRelayService && response.error?.some((x) => x.includes('already bound to the other account'))) {
        throw new FireflyAlreadyBoundError(Source.Farcaster);
    }

    const data = resolveFireflyResponseData(response);
    patchFarcasterSessionRequired(session, data.fid, data.farcaster_signer_private_key);
    return data;
}

async function bindTwitterSessionToFirefly(session: TwitterSession, signal?: AbortSignal) {
    const encryptedResponse = await fetchJson<ResponseJson<string>>('/api/twitter/auth', {
        method: 'POST',
        headers: TwitterSession.payloadToHeaders(session.payload),
        signal,
    });
    const encrypted = resolveTwitterResponseData(
        encryptedResponse,
        '[bindTwitterSessionToFirefly] Failed to encrypt twitter session.',
    );

    const response = await fireflySessionHolder.fetch<BindResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/exchange/bindTwitter'),
        {
            method: 'POST',
            body: JSON.stringify({
                data: encrypted,
            }),
            signal,
        },
    );

    if (response.error?.some((x) => x.includes('already bound to the other account'))) {
        throw new FireflyAlreadyBoundError(Source.Twitter);
    }

    const data = resolveFireflyResponseData(response);
    return data;
}

async function bindBskySessionToFirefly(session: BskySession, signal?: AbortSignal) {
    try {
        const response = await fireflySessionHolder.fetch<BindResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/bsky/binding'),
            {
                method: 'POST',
                body: JSON.stringify({
                    did: session.did,
                    token: session.sessionPayload.accessJwt,
                    serviceEndpoint: getDidServiceHost(session.sessionPayload.didDoc),
                }),
                signal,
            },
        );

        const data = resolveFireflyResponseData(response);
        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('already bound to the other account')) {
            throw new FireflyAlreadyBoundError(Source.Bsky);
        }
        throw error;
    }
}

async function bindAppleSessionToFirefly(session: ThirdPartySession, signal?: AbortSignal) {
    try {
        const response = await fireflySessionHolder.fetch<BindResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindApple'),
            {
                method: 'POST',
                body: JSON.stringify({
                    idToken: session.token,
                    nonce: session.payload?.nonce,
                }),
                signal,
            },
        );

        const data = resolveFireflyResponseData(response);
        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('already bound to the other account')) {
            throw new FireflyAlreadyBoundError(Source.Apple);
        }
        throw error;
    }
}

async function bindGoogleSessionToFirefly(session: ThirdPartySession, signal?: AbortSignal) {
    try {
        const response = await fireflySessionHolder.fetch<BindResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindGoogle'),
            {
                method: 'POST',
                body: JSON.stringify({
                    idToken: session.token,
                }),
                signal,
            },
        );

        const data = resolveFireflyResponseData(response);
        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('already bound to the other account')) {
            throw new FireflyAlreadyBoundError(Source.Google);
        }
        throw error;
    }
}

async function bindTelegramSessionToFirefly(session: ThirdPartySession, signal?: AbortSignal) {
    try {
        const response = await fireflySessionHolder.fetch<BindResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindTelegram'),
            {
                method: 'POST',
                body: JSON.stringify({
                    telegramToken: session.token,
                }),
                signal,
            },
        );

        const data = resolveFireflyResponseData(response);
        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('already bound to the other account')) {
            throw new FireflyAlreadyBoundError(Source.Telegram);
        }
        throw error;
    }
}

async function bindEmailSessionToFirefly(session: ThirdPartySession, signal?: AbortSignal) {
    try {
        if (!session.payload?.email || !session.payload?.passcode) throw new Error('Email and passcode are required.');

        const response = await fireflySessionHolder.fetch<BindResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindEmail'),
            {
                method: 'POST',
                body: JSON.stringify({
                    email: session.payload.email,
                    otp: session.payload.passcode,
                }),
                signal,
            },
        );

        const data = resolveFireflyResponseData(response);

        if (session.profileId === NOT_DEPEND_SECRET) {
            session.profileId = data.account_id;
            session.payload = {
                ...session.payload,
                accountId: data.account_id,
            };
        }

        return data;
    } catch (error) {
        if (error instanceof Error && error.message.includes('Email has already been taken')) {
            throw new FireflyAlreadyBoundError(Source.Email);
        }

        throw error;
    }
}

/**
 * Bind a lens or farcaster session to the currently logged-in Firefly session.
 * @param session
 * @param signal
 * @returns
 */
export async function bindFireflySession(session: Session, signal?: AbortSignal) {
    // Ensure that the Firefly session is resumed before calling this function.
    fireflySessionHolder.assertSession();

    switch (session.type) {
        case SessionType.Farcaster:
            return bindFarcasterSessionToFirefly(session as FarcasterSession, signal);
        case SessionType.Lens:
            return bindLensToFirefly(session as LensSession, signal);
        case SessionType.Twitter:
            return bindTwitterSessionToFirefly(session as TwitterSession, signal);
        case SessionType.Bsky:
            return bindBskySessionToFirefly(session as BskySession, signal);
        case SessionType.Firefly:
            throw new NotAllowedError();
        case SessionType.Apple:
            return bindAppleSessionToFirefly(session as ThirdPartySession, signal);
        case SessionType.Google:
            return bindGoogleSessionToFirefly(session as ThirdPartySession, signal);
        case SessionType.Telegram:
            return bindTelegramSessionToFirefly(session as ThirdPartySession, signal);
        case SessionType.Email:
            return bindEmailSessionToFirefly(session as ThirdPartySession);
        default:
            safeUnreachable(session.type);
            throw new UnreachableError('[bindFireflySession] session type', session.type);
    }
}
