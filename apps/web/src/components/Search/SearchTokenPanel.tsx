import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { SearchTokenPanelEVM } from '@/components/Search/SearchTokenPanelEVM.js';
import { SearchTokenPanelSolana } from '@/components/Search/SearchTokenPanelSolana.js';
import { NetworkType } from '@/constants/enum.js';
import { type Token } from '@/providers/types/Transfer.js';

interface SearchTokenPanelProps {
    networkType: NetworkType;
    address: string;
    validChainIds?: number[];
    onSelected?: (selected: Token) => void;
    isSelected?: (item: Token) => boolean;
}

export const SearchTokenPanel = memo<SearchTokenPanelProps>(function SearchTokenPanel({ networkType, ...props }) {
    switch (networkType) {
        case NetworkType.Ethereum:
            return <SearchTokenPanelEVM {...props} />;
        case NetworkType.Solana:
            return <SearchTokenPanelSolana {...props} />;
        default:
            safeUnreachable(networkType);
            return null;
    }
});
