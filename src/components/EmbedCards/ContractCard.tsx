import { safeUnreachable } from '@masknet/kit';
import { memo } from 'react';

import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { CollectionPreviewer, NFTPreviewer } from '@/components/NFTs/NFTPreview.js';
import { TokenCard } from '@/components/Token/TokenCard.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import type { DetectedAddress } from '@/providers/types/Firefly.js';

interface ContractCardProps extends AddressCardProps {
    chainId: number;
    contractType: Exclude<DetectedAddress['contract_type'], 'program'>;
}
export const ContractCard = memo<ContractCardProps>(function ContractCard({ contractType, chainId, ...rest }) {
    const isCollection = ['ERC721', 'ERC1155', 'nft'].includes(contractType);
    const { data: collection } = useNFTCollection(rest.address, chainId, isCollection);
    const { data: nft } = useNFTDetail(rest.address, undefined, chainId);

    switch (contractType) {
        case 'ERC20':
        case 'token':
            return (
                <TokenContextProvider>
                    <TokenCard {...rest} />
                </TokenContextProvider>
            );
        case 'ERC721':
        case 'ERC1155':
        case 'nft':
            if (nft?.__origin__) return <NFTPreviewer nft={nft.__origin__} showTradeInfo />;
            return collection ? <CollectionPreviewer collection={collection} showTradeInfo /> : null;
        case 'unknown':
            return null;
        default:
            safeUnreachable(contractType);
            return;
    }
});
