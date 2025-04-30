import { type ChallengeRequest, evmAddress, SessionClient } from '@lens-protocol/client';

import { createLensSDK, LocalStorageProvider, MemoryStorageProvider } from '@/helpers/createLensSDK.js';
import { getWalletClientForLensChain } from '@/helpers/getWalletClientForLensChain.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

export async function createAccountWithSessionClient(
    sessionClient: SessionClient,
    profile: Profile,
    signal?: AbortSignal,
) {
    const session = createLensSession(profile.profileId, sessionClient);

    const fireflySession = await bindOrRestoreFireflySession(session, signal);

    return {
        session,
        profile,
        fireflySession,
    } satisfies Account;
}

export async function createAccountForProfileId(profile: Profile, useMemoryStorage = false, signal?: AbortSignal) {
    const walletClient = await getWalletClientForLensChain();

    const storage = useMemoryStorage ? new MemoryStorageProvider() : new LocalStorageProvider();
    const sdk = createLensSDK(storage);

    const address = evmAddress(walletClient.account.address);
    const options: ChallengeRequest =
        profile.profileType === 'AccountManaged'
            ? {
                  accountManager: { manager: address, account: evmAddress(profile.profileId) },
              }
            : {
                  accountOwner: { owner: address, account: evmAddress(profile.profileId) },
              };
    const loginRes = await sdk.login({
        signMessage: (message) => {
            return walletClient.signMessage({ message });
        },
        ...options,
    });
    if (!loginRes.isOk()) {
        throw new Error(`Failed to login on Lens`);
    }
    const sessionClient = loginRes.value;

    const account = await createAccountWithSessionClient(sessionClient, profile, signal);

    return { account, sessionClient } as const;
}
