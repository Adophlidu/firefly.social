import { EMPTY_LIST } from '@dimensiondev/constants';
import { WalletSource } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAllConnections } from '@/hooks/useAllConnections.js';
import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';

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
            return getPredictionPortfolio(externalWallets);
        },
        select(data) {
            return data.result.map((x) => x.proxy);
        },
    });
}
