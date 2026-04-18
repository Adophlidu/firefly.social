import { isValidChainIdSolana } from '@dimensiondev/web3/chains';

import type { EVM } from '@/providers/nftscan/types.js';

export function resolveNFTId(chainId: number, address: string, tokenId: string, lowerCase = true) {
    const formattedAddress = lowerCase ? address.toLowerCase() : address;
    if (isValidChainIdSolana(chainId)) {
        return `solana.${formattedAddress}`;
    }

    return `${chainId}.${formattedAddress}.${tokenId}`;
}

export function resolveNFTIdFromAsset(asset: EVM.Asset, lowerCase?: boolean) {
    return resolveNFTId(asset.chain_id, asset.contract_address, asset.token_id, lowerCase);
}
