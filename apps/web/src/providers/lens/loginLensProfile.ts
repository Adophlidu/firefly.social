import { envs } from '@dimensiondev/envs';
import { SeverityError } from '@dimensiondev/utils';
import type { ChallengeRequest, SignMessage } from '@lens-protocol/client';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { createLensPublicClient } from '@/providers/lens/createLensPublicClient.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface LoginOptions {
    ownerOrManager: string;
    useMemoryStorage?: boolean;
    signMessage: SignMessage;
}

export async function loginLensProfile(profile: Profile, options: LoginOptions) {
    const client = createLensPublicClient();

    const address = safeEvmAddress(options.ownerOrManager);
    const requestOptions: ChallengeRequest =
        profile.profileType === 'AccountManaged'
            ? {
                  accountManager: {
                      manager: address,
                      account: safeEvmAddress(profile.profileId),
                      app: envs.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
                  },
              }
            : {
                  accountOwner: {
                      owner: address,
                      account: safeEvmAddress(profile.profileId),
                      app: envs.external.NEXT_PUBLIC_LENS_APP_ADDRESS,
                  },
              };
    const loginRes = await client.login({
        signMessage: options.signMessage,
        ...requestOptions,
    });
    if (!loginRes.isOk()) {
        throw new SeverityError(`Failed to login on Lens`);
    }

    return loginRes.value;
}
