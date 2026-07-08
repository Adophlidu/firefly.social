import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import type { WalletProfileInfo, WalletProfileInfoListResponse } from '@/providers/types/Firefly.js';

/**
 * Picks a wallet's social profile out of a `/v2/wallet/profileinfo/list` response. The response keys
 * each wallet's entry by its resolved on-chain address, so we match `address` against those keys.
 * Shared by `useProxyWalletInfo` and the timeline share-identity resolver so both stay in sync.
 */
export function pickWalletProfileByAddress(
    response: WalletProfileInfoListResponse | null | undefined,
    address: string,
): WalletProfileInfo | null {
    const firstEntry = first(response?.data?.walletAddress);
    if (!firstEntry) return null;

    for (const key in firstEntry) {
        if (isSameEthereumAddress(key, address)) return firstEntry[key];
    }

    return null;
}
