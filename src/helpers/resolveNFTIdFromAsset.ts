import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveSimpleHashChain } from '@/helpers/resolveSimpleHashChain.js';
import type { NonFungibleAsset } from '@/mask_pkgs/web3-shared/base/index.js';

export function resolveNFTId(chainId: number, address: string, tokenId: string, lowerCase = true) {
    const formattedAddress = lowerCase ? address.toLowerCase() : address;
    if (isValidChainIdSolana(chainId)) {
        return `solana.${formattedAddress}`;
    }

    const chain = resolveSimpleHashChain(chainId) || 'ethereum';
    return `${chain}.${formattedAddress}.${tokenId}`;
}

export function resolveNFTIdFromAsset(asset: NonFungibleAsset<number, number>, lowerCase?: boolean) {
    return resolveNFTId(asset.chainId, asset.address, asset.tokenId, lowerCase);
}
