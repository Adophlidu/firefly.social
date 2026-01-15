import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { WalletSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { getBetsPortfolio } from '@/providers/firefly/bets/getBetsPortfolio.js';

export function useAllProxyWallets() {
    const { data: { evmConnections = EMPTY_LIST } = {} } = useAllConnections();
    const externalWallets = useMemo(() => {
        const addresses = evmConnections
            .filter((x) => x.source === WalletSource.Privy)
            .map((x) => x.address.toLowerCase());
        return addresses.sort();
    }, [evmConnections]);

    return useQuery({
        queryKey: ['get-bets-portfolio', ...externalWallets],
        enabled: !!externalWallets.length,
        queryFn() {
            return getBetsPortfolio(externalWallets);
        },
        select(data) {
            return data.result.map((x) => x.proxy);
        },
    });
}
