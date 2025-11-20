import { Source } from '@/constants/enum.js';
import { FireflyAccountAbsentError, FireflyAlreadyBoundError } from '@/constants/error.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { FarcasterAccountInfo } from '@/providers/types/Firefly.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithPublicKey } from '@/providers/warpcast/createSignedKeyPayload.js';

async function createAccount(accountInfo: FarcasterAccountInfo, signal?: AbortSignal) {
    const payload = await createSignedKeyPayloadWithPublicKey(accountInfo.signer_publickey, signal);
    const key = await createSignedKey(payload.body, signal);
    const session = new FarcasterSession(
        accountInfo.fid,
        accountInfo.signer_privatekey,
        payload.timestamp,
        payload.expiresAt,
        key.token,
        undefined,
        undefined,
    );
    const profile = await getFarcasterProfileById(session.profileId);
    return {
        session,
        profile,
        fireflySession: fireflySessionHolder.session || undefined,
    } satisfies Account;
}

/**
 * Silent create farcaster account from firefly account
 */
export async function createFarcasterFromFirefly(accountInfo: FarcasterAccountInfo, signal?: AbortSignal) {
    try {
        return await createAccount(accountInfo, signal);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Account does not exist')) {
            throw new FireflyAccountAbsentError(Source.Farcaster);
        }

        if (error instanceof Error && error.message.includes('This farcaster already bound to the other account')) {
            throw new FireflyAlreadyBoundError(Source.Farcaster);
        }
        throw error;
    }
}
