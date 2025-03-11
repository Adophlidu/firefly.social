import { safeUnreachable } from '@masknet/kit';
import { memo } from 'react';

import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { CollectionPreviewer } from '@/components/NFTs/NFTPreview.js';
import { TokenCard } from '@/components/Token/TokenCard.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractCardProps extends AddressCardProps {
    chainId: number;
    contractType: Exclude<DetectedAddress['contract_type'], 'token' | 'program'>;
}
export const ContractCard = memo<ContractCardProps>(function ContractCard({ contractType, chainId, ...rest }) {
    const isCollection = ['ERC721', 'ERC1155', 'nft'].includes(contractType);
    const { data: collection } = useNFTCollection(rest.address, chainId, isCollection);

    switch (contractType) {
        case 'ERC20':
            return (
                <TokenContextProvider>
                    <TokenCard {...rest} />
                </TokenContextProvider>
            );
        case 'ERC721':
        case 'ERC1155':
        case 'nft':
            return collection ? <CollectionPreviewer collection={collection} showTradeInfo /> : null;
        default:
            safeUnreachable(contractType);
            return;
    }
});
