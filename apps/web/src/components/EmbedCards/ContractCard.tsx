import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { TokenCard } from '@/components/EmbedCards/TokenCard.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractCardProps extends AddressCardProps {
    chainId: number;
    contractType: Exclude<DetectedAddress['contract_type'], 'program' | 'unknown'>;
}

export const ContractCard = memo<ContractCardProps>(function ContractCard({ contractType, chainId: _, ...rest }) {
    switch (contractType) {
        case 'ERC20':
        case 'token':
            return <TokenCard {...rest} />;
        case 'ERC721':
        case 'ERC1155':
        case 'nft':
            // NFT collection embed cards have been retired.
            return null;
        default:
            safeUnreachable(contractType);
            return;
    }
});
