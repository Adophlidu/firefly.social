import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { signMessageWithPrivy } from '@/providers/firefly/endpoint/signMessageWithPrivy.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { loginLensProfile } from '@/providers/lens/loginLensProfile.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { Account } from '@/providers/types/Account.js';

async function getProfileNeedToLogin(profileId: string) {
    const privyEvmWallet = (await ensureCreatedFireflyWallet('eth'))?.address;
    if (!privyEvmWallet) throw new Error('No privy evm wallet found.');

    const profiles = await lensSocialMediaProvider.getProfilesByAddress(privyEvmWallet);
    if (!profiles.length) throw new Error('The privy wallet does not have managed or owned lens profile.');

    const profileToLogin = profiles.find((x) => isSameEthereumAddress(x.profileId, profileId));
    if (!profileToLogin) throw new Error('The privy wallet is not a manager or owner for current lens profile.');

    return {
        profileToLogin,
        privyEvmWallet,
    };
}

export async function autoLoginWithPrivy(profileId: string) {
    // 1. ensure privy wallet is owner or manager
    const { profileToLogin, privyEvmWallet } = await getProfileNeedToLogin(profileId);

    // 2. login lens
    const sessionClient = await loginLensProfile(profileToLogin, {
        useMemoryStorage: true,
        ownerOrManager: privyEvmWallet,
        signMessage: async (message) => {
            const result = await signMessageWithPrivy(message);
            return result.signature;
        },
    });

    // 3. create new account
    const lensSession = createLensSession(profileToLogin.profileId, sessionClient);
    const account = {
        profile: profileToLogin,
        session: lensSession,
        origin: 'force_restore',
        fireflySession: fireflySessionHolder.session ?? undefined,
    } satisfies Account;

    return { account, sessionClient } as const;
}
