import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { TokenCard } from '@/components/EmbedCards/TokenCard.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { CollectionPreviewer } from '@/components/NFTs/NFTPreview.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractCardProps extends AddressCardProps {
    chainId: number;
    contractType: Exclude<DetectedAddress['contract_type'], 'program' | 'unknown'>;
}
export const ContractCard = memo<ContractCardProps>(function ContractCard({ contractType, chainId, ...rest }) {
    const isCollection = ['ERC721', 'ERC1155', 'nft'].includes(contractType);
    const { data: collection } = useNFTCollection(rest.address, chainId, isCollection);

    switch (contractType) {
        case 'ERC20':
        case 'token':
            return <TokenCard {...rest} />;
        case 'ERC721':
        case 'ERC1155':
        case 'nft':
            return collection ? (
                <CollectionPreviewer className={rest.className} collection={collection} showTradeInfo />
            ) : null;
        default:
            safeUnreachable(contractType);
            return;
    }
});
