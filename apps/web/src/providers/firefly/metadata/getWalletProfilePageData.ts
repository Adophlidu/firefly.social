import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoint/getWalletProfileByAddressOrEns.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export const getWalletProfilePageData = cache(async (addressOrEns: string): Promise<WalletProfile | null> => {
    const walletProfile = await runInSafeAsync(() => getWalletProfileByAddressOrEns(addressOrEns, false));
    return walletProfile ?? null;
});
