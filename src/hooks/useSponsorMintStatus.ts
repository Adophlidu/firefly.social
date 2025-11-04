import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { fireflyWalletTransactionProvider } from '@/providers/firefly/WalletTransaction.js';
import type { SponsorMintOptions } from '@/providers/types/Firefly.js';

export function useSponsorMintStatus(options: SponsorMintOptions) {
    const account = useAccount();

    return useQuery({
        queryKey: ['sponsor-mint-status', account.address, options.chainId, options.contractAddress, options.tokenId],
        enabled: !!options.chainId && !!options.contractAddress,
        queryFn: async () => {
            return fireflyWalletTransactionProvider.getSponsorMintStatus(options);
        },
    });
}
