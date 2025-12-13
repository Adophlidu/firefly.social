import { getPublicKey, utils } from '@noble/ed25519';
import { type Hex, toHex } from 'viem';

import { NOT_DEPEND_SECRET } from '@/constants/static.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithPublicKey } from '@/providers/warpcast/createSignedKeyPayload.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

async function createSession(signal?: AbortSignal) {
    // create key pair in client side
    const privateKey = utils.randomPrivateKey();
    const publicKey: Hex = `0x${Buffer.from(await getPublicKey(privateKey)).toString('hex')}`;
    const payload = await createSignedKeyPayloadWithPublicKey(publicKey, signal);
    const key = await createSignedKey(payload.body, signal);

    const farcasterSession = new FarcasterSession(
        // we don't posses the fid until the key request was signed
        NOT_DEPEND_SECRET,
        toHex(privateKey),
        payload.timestamp,
        payload.expiresAt,
        // the signer request token is one-time use
        key.token,
    );

    return {
        deeplink: key.deeplinkUrl,
        session: farcasterSession,
    };
}

/**
 * Initiates the creation of a session by granting data access permission to another FID.
 * @param signal
 * @returns
 */
async function initialSignerRequestToken(callback?: (url: string) => void, signal?: AbortSignal) {
    const { deeplink, session } = await createSession(signal);

    // invalid session type
    if (!FarcasterSession.isGrantByPermission(session)) throw new Error('Invalid session type');

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

export async function createAccountByGrantPermission(callback?: (url: string) => void, signal?: AbortSignal) {
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
