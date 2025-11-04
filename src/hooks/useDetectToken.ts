import { skipToken, useQuery } from '@tanstack/react-query';

import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';

export function useDetectToken(address: string | undefined, enabled = true) {
    return useQuery({
        enabled: enabled && !!address,
        queryKey: ['detect-address', address],
        queryFn: address ? () => fireflyWalletProvider.detectAddress(address) : skipToken,
        select: (data) => {
            if (!data) return;
            const tokens = data.list.filter((x) => {
                return (
                    (x.type === 'eth' && x.contract_type === 'ERC20') ||
                    (x.type === 'solana' && x.contract_type === 'token')
                );
            });
            return tokens[0];
        },
    });
}
