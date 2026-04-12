import { getPublicKey, utils } from '@noble/ed25519';
import { bytesToHex, toHex } from 'viem';

import { FarcasterSession, FarcasterSponsorship } from '@/providers/farcaster/Session.js';
import { getFarcasterProfileById } from '@/providers/firefly/farcaster-hub/getFarcasterProfileById.js';
import type { Account } from '@/providers/types/Account.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithSponsorship } from '@/providers/warpcast/createSignedKeyPayload.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

async function createSession(signal?: AbortSignal) {
    const privateKey = utils.randomPrivateKey();
    const publicKey = bytesToHex(await getPublicKey(privateKey));
    const payload = await createSignedKeyPayloadWithSponsorship(publicKey);
    const key = await createSignedKey(payload.body, signal);

    const farcasterSession = new FarcasterSession(
        `${key.requestFid}`,
        toHex(privateKey),
        payload.timestamp,
        payload.expiresAt,
        // the signer request token is one-time use
        key.token,
        undefined,
        `${FarcasterSponsorship.Firefly}-${payload.body.sponsorship?.signature ?? '0x'}`,
    );

    return {
        deeplink: key.deeplinkUrl,
        session: farcasterSession,
    };
}

async function initialSignerRequestToken(callback?: (url: string) => void, signal?: AbortSignal) {
    const { deeplink, session } = await createSession(signal);

    // invalid session type
    if (!FarcasterSession.isSponsorship(session)) throw new Error('Invalid session type');

    // present QR code to the user or open the link in a new tab
    callback?.(deeplink);

    const result = await pollingSignerRequestToken(session.signerRequestToken, signal);
    if (result.userFid) {
        session.profileId = `${result.userFid}`;
    }

    // polling failed
    if (!session.profileId)
        throw new Error(
            'Failed to query the signed key request status after several attempts. Please try again later.',
        );

    return session;
}

export async function createAccountByFireflySponsorship(callback?: (url: string) => void, signal?: AbortSignal) {
    const session = await initialSignerRequestToken(callback, signal);

    // polling for the session to be ready
    const fireflySession = await bindOrRestoreFireflySession(session, signal);

    // profile id is available after the session is ready
    const profile = await getFarcasterProfileById(session.profileId);

    return {
        session,
        profile,
        fireflySession,
    } satisfies Account;
}
