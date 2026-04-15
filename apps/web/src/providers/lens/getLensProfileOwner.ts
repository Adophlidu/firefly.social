import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { fetchAccount } from '@lens-protocol/client/actions';
import type { Address } from 'viem';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const fetchAccountOwner = memoizePromise(
    async (address: string) => {
        const account = await ensureLensResult(
            fetchAccount(lensClientHolder.client, { address: safeEvmAddress(address) }),
        );
        return (account?.owner as Address) || null;
    },
    (address) => address.toLowerCase(),
);

export async function getLensProfileOwner(profile: Profile): Promise<Address | null> {
    if (isValidAddressEthereum(profile.ownedBy?.address)) {
        return profile.ownedBy.address;
    }

    return fetchAccountOwner(profile.profileId);
}
