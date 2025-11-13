import type { ChallengeRequest, SignMessage } from '@lens-protocol/client';

import { env } from '@/constants/env.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { createLensSDK, LocalStorageProvider, MemoryStorageProvider } from '@/providers/lens/createLensSDK.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface LoginOptions {
    ownerOrManager: string;
    useMemoryStorage?: boolean;
    signMessage: SignMessage;
}

export async function loginLensProfile(profile: Profile, options: LoginOptions) {
    const storage = options.useMemoryStorage ? new MemoryStorageProvider() : new LocalStorageProvider();
    const sdk = createLensSDK(storage);

    const address = safeEvmAddress(options.ownerOrManager);
    const requestOptions: ChallengeRequest =
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
        signMessage: options.signMessage,
        ...requestOptions,
    });
    if (!loginRes.isOk()) {
        throw new Error(`Failed to login on Lens`);
    }

    return loginRes.value;
}
