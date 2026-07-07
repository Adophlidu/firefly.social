import type { SessionClient } from '@lens-protocol/client';
import { mainnet } from 'viem/chains';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
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

export async function createAccountForProfileId(profile: Profile, signal?: AbortSignal) {
    const { wagmiConfig } = await loadWagmiClient();
    const walletClient = await getWalletClientRequired(wagmiConfig, { chainId: mainnet.id });
    const sessionClient = await loginLensProfile(profile, {
        ownerOrManager: walletClient.account.address,
        signMessage: (message) => walletClient.signMessage({ message }),
    });

    const account = await createAccountWithSessionClient(sessionClient, profile, signal);

    return { account, sessionClient } as const;
}
