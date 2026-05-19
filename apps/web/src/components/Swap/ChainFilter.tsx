import type { NetworkType } from '@dimensiondev/enums';
import { memo, type ReactNode } from 'react';

import { FilterPanel } from '@/components/FilterPanel.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

interface ChainFilterProps {
    networkType?: NetworkType;
    children?: ReactNode;
}

export const ChainFilter = memo(function ChainFilter({ networkType }: ChainFilterProps) {
    const { selectedChainId, validChains, setSelectedChainId } = useTransactionsStateStore(networkType);
    return (
        <FilterPanel
            selectedChainId={selectedChainId}
            validChains={validChains}
            onChainChange={setSelectedChainId}
            networkType={networkType}
        />
    );
});
