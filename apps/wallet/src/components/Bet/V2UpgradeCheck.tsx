import { useSuspenseQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { V2UpgradeModal } from '@/components/Bet/V2UpgradeModal.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketUpgradeTaskQueryOptions } from '@/queries/firefly/getPolymarketUpgradeTaskQueryOptions.js';

interface V2UpgradeCheckProps {
    children: ReactNode;
}

export function V2UpgradeCheck({ children }: V2UpgradeCheckProps) {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: upgradeTask } = useSuspenseQuery(getPolymarketUpgradeTaskQueryOptions(account.proxyAddress));

    if (upgradeTask.is_upgraded) return <>{children}</>;

    return <V2UpgradeModal proxyAddress={account.proxyAddress} />;
}
