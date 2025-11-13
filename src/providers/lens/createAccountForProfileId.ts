import { SessionClient } from '@lens-protocol/client';

import { createLensSession } from '@/providers/lens/createLensSession.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import { loginLensProfile } from '@/providers/lens/loginLensProfile.js';
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
    const sessionClient = await loginLensProfile(profile, {
        useMemoryStorage,
        ownerOrManager: walletClient.account.address,
        signMessage: (message) => walletClient.signMessage({ message }),
    });

    const account = await createAccountWithSessionClient(sessionClient, profile, signal);

    return { account, sessionClient } as const;
}
