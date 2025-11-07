import { type ChallengeRequest, SessionClient } from '@lens-protocol/client';

import { env } from '@/constants/env.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { createLensSDK, LocalStorageProvider, MemoryStorageProvider } from '@/providers/lens/createLensSDK.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

async function createAccountWithSessionClient(sessionClient: SessionClient, profile: Profile, signal?: AbortSignal) {
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

    const address = safeEvmAddress(walletClient.account.address);
    const options: ChallengeRequest =
        profile.profileType === 'AccountManaged'
            ? {
                  accountManager: {
                      manager: address,
                      account: safeEvmAddress(profile.profileId),
                      app: env.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
                  },
              }
            : {
                  accountOwner: {
                      owner: address,
                      account: safeEvmAddress(profile.profileId),
                      app: env.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
                  },
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
