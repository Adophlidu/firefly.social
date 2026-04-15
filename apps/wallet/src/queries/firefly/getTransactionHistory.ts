import { isValidAddressSolana } from '@dimensiondev/web3/utils';
import { infiniteQueryOptions } from '@tanstack/react-query';

import type { WalletHistoryTransactionsResponseData } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getTransactionHistory(chains: number[], address: string | undefined) {
    const addr = isValidAddressSolana(address) ? address : address?.toLowerCase();
    return infiniteQueryOptions({
        enabled: !!address,
        queryKey: ['wallet-transaction-history', addr, chains],
        async queryFn({ pageParam }: { pageParam?: string }) {
            return getFireflyEndpoint().getWalletHistoryTransactions(
                chains,
                addr!,
                pageParam
                    ? {
                          cursor: pageParam,
                      }
                    : {},
            );
        },
        initialPageParam: '',
        getNextPageParam: (lastPage: WalletHistoryTransactionsResponseData) => {
            return lastPage.cursor;
        },
    });
}
