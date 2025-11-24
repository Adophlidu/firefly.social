import type { Account } from '@lens-protocol/client';
import { ManagedAccountsVisibility, PageSize } from '@lens-protocol/client';
import { fetchAccountsAvailable } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function getProfilesByAddress(address: string): Promise<Profile[]> {
    const profiles = await ensureLensResult(
        fetchAccountsAvailable(lensClientHolder.client, {
            managedBy: safeEvmAddress(address),
            pageSize: PageSize.Fifty,
            includeOwned: true,
            hiddenFilter: ManagedAccountsVisibility.All,
        }),
    );
    return profiles.items.map((x) => ({
        ...formatLensProfileV3(x.account as Account),
        profileType: x.__typename,
    }));
}
