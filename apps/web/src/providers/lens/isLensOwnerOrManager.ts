import { isSameEthereumAddress } from '@dimensiondev/web3-utils';
import { ManagedAccountsVisibility, PageSize } from '@lens-protocol/client';
import { fetchAccountsAvailable } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getLensProfileOwner } from '@/providers/lens/getLensProfileOwner.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function isLensOwnerOrManager(
    address: string,
    profile: Profile,
): Promise<{
    type: 'owner' | 'manager';
} | null> {
    const accountOwner = await getLensProfileOwner(profile);
    if (isSameEthereumAddress(address, accountOwner)) {
        return {
            type: 'owner',
        };
    }

    const { items } = await ensureLensResult(
        fetchAccountsAvailable(lensClientHolder.client, {
            managedBy: safeEvmAddress(address),
            pageSize: PageSize.Fifty,
            includeOwned: false,
            hiddenFilter: ManagedAccountsVisibility.All,
        }),
    );
    if (items.some(({ account }) => isSameEthereumAddress(account.address, profile.profileId))) {
        return { type: 'manager' };
    }

    return null;
}
