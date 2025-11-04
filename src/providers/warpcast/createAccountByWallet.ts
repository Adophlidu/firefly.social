import dayjs from 'dayjs';
import { signMessage } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { FireflyAccountAbsentError, FireflyAlreadyBoundError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithPublicKey } from '@/providers/warpcast/createSignedKeyPayload.js';

async function createAccount(signal?: AbortSignal) {
    const { account } = await getWalletClientRequired(wagmiConfig);
    const originalMessage = `firefly sign message ${dayjs().unix()}`;
    const signatureMessage = await signMessage(wagmiConfig, {
        message: originalMessage,
        account: account.address,
    });
    const loginResponse = await fireflyEndpointProvider.loginFarcasterWithWallet(
        account.address,
        originalMessage,
        signatureMessage,
        true,
    );
    const payload = await createSignedKeyPayloadWithPublicKey(loginResponse.signerPublickey, signal);
    const key = await createSignedKey(payload.body, signal);
    const session = new FarcasterSession(
        loginResponse.fid,
        loginResponse.signerPrivatekey,
        payload.timestamp,
        payload.expiresAt,
        key.token,
        undefined,
        undefined,
        account.address,
    );
    const fireflySession = new FireflySession(
        loginResponse.uid,
        loginResponse.accessToken,
        session,
        null,
        loginResponse.isNew,
        loginResponse,
    );
    const profile = await getFarcasterProfileById(session.profileId);
    return {
        session,
        profile,
        fireflySession,
    } satisfies Account;
}

export async function createAccountByWallet(signal?: AbortSignal) {
    try {
        return await createAccount(signal);
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
