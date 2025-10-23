import { PageSize } from '@lens-protocol/client';
import { fetchAccount, fetchAccountManagers } from '@lens-protocol/client/actions';
import type { Address } from 'viem';

import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const fetchAccountOwner = memoizePromise(
    async (address: string) => {
        const account = await ensureLensResult(
            fetchAccount(lensSessionHolder.sdk, { address: safeEvmAddress(address) }),
        );
        return (account?.owner as Address) || null;
    },
    (address) => address.toLowerCase(),
);

export async function isLensOwnerOrManager(
    address: string,
    profile: Profile,
): Promise<{
    type: 'owner' | 'manager';
} | null> {
    const accountOwner = profile.ownedBy?.address || (await fetchAccountOwner(profile.profileId));
    if (isSameEthereumAddress(address, accountOwner)) {
        return {
            type: 'owner',
        };
    }

    const { items } = await ensureLensResult(
        fetchAccountManagers(lensSessionHolder.sessionClient, {
            pageSize: PageSize.Fifty,
        }),
    );
    if (items.length && items.some((account) => isSameEthereumAddress(account.manager, address))) {
        return { type: 'manager' };
    }

    return null;
}
