import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { V2UpgradeModal } from '@/components/Bet/V2UpgradeModal.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketUpgradeTaskQueryOptions } from '@/queries/firefly/getPolymarketUpgradeTaskQueryOptions.js';

interface V2UpgradeCheckProps {
    children: ReactNode;
}

export function V2UpgradeCheck({ children }: V2UpgradeCheckProps) {
    const accountQuery = useQuery(getPolymarketAccountQueryOptions());
    const proxyAddress = accountQuery.data?.proxyAddress;
    const upgradeTaskQuery = useQuery(getPolymarketUpgradeTaskQueryOptions(proxyAddress));

    if (accountQuery.isPending) return <LoadingPanel />;

    if (accountQuery.isError) {
        if (accountQuery.error instanceof InvalidPolymarketAccountError) return <>{children}</>;
        throw accountQuery.error;
    }

    if (!proxyAddress) return <>{children}</>;

    if (upgradeTaskQuery.isPending) return <LoadingPanel />;

    if (upgradeTaskQuery.isError) {
        if (upgradeTaskQuery.error instanceof InvalidPolymarketAccountError) return <>{children}</>;
        throw upgradeTaskQuery.error;
    }

    if (upgradeTaskQuery.data?.is_upgraded) return <>{children}</>;

    return <V2UpgradeModal proxyAddress={proxyAddress} />;
}
