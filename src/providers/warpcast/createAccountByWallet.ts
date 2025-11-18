import dayjs from 'dayjs';
import { signMessage } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { Source } from '@/constants/enum.js';
import { FireflyAccountAbsentError, FireflyAlreadyBoundError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { loginFarcasterWithWallet } from '@/providers/firefly/farcaster-account/loginFarcasterWithWallet.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithPublicKey } from '@/providers/warpcast/createSignedKeyPayload.js';

interface Options {
    publickey: string;
    privatekey: string;
    fid: string;
    address?: string;
    signal?: AbortSignal;
}
export async function createFarcasterSessionBySigner({ publickey, privatekey, fid, address, signal }: Options) {
    const payload = await createSignedKeyPayloadWithPublicKey(publickey, signal);
    const key = await createSignedKey(payload.body, signal);
    return new FarcasterSession(
        fid,
        privatekey,
        payload.timestamp,
        payload.expiresAt,
        key.token,
        undefined,
        undefined,
        address,
    );
}

async function createAccount(signal?: AbortSignal) {
    const { account } = await getWalletClientRequired(wagmiConfig);
    const originalMessage = `firefly sign message ${dayjs().unix()}`;
    const signatureMessage = await signMessage(wagmiConfig, {
        message: originalMessage,
        account: account.address,
    });
    const loginResponse = await loginFarcasterWithWallet(account.address, originalMessage, signatureMessage, true);
    const session = await createFarcasterSessionBySigner({
        publickey: loginResponse.signerPublickey,
        privatekey: loginResponse.signerPrivatekey,
        fid: loginResponse.fid,
        address: account.address,
        signal,
    });
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
