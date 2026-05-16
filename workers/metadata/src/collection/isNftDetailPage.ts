import { isValidAddressEthereum } from '@dimensiondev/workers-shared/helpers/isAddress.js';

import { isValidChainIdEthereum, isValidChainIdSolana } from '@/metadata/src/nft/isValidChainId.js';

export function isNftDetailPage(chainIdOrCollectionId: string, addressOrTokenId: string) {
    const isChainId = isValidChainIdEthereum(+chainIdOrCollectionId) || isValidChainIdSolana(+chainIdOrCollectionId);
    return !isChainId && !isValidAddressEthereum(addressOrTokenId);
}
