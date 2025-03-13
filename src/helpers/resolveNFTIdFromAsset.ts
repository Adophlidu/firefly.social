import type { NonFungibleAsset } from '@masknet/web3-shared-base';
import { isValidChainId as isValidSolanaChainId } from '@masknet/web3-shared-solana';

import { resolveSimpleHashChain } from '@/helpers/resolveSimpleHashChain.js';

export function resolveNFTId(chainId: number, address: string, tokenId: string, lowerCase = true) {
    const formattedAddress = lowerCase ? address.toLowerCase() : address;
    if (isValidSolanaChainId(chainId)) {
        return `solana.${formattedAddress}`;
    }

    const chain = resolveSimpleHashChain(chainId) || 'ethereum';
    return `${chain}.${formattedAddress}.${tokenId}`;
}

export function resolveNFTIdFromAsset(asset: NonFungibleAsset<number, number>, lowerCase?: boolean) {
    return resolveNFTId(asset.chainId, asset.address, asset.tokenId, lowerCase);
}
