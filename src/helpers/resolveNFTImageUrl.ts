import type { SimpleHash } from '@/providers/simplehash/type.js';
import { resolveImageURL } from '#masknet/web3-shared-evm';

export function resolveNFTImageUrl(nft: SimpleHash.NFT) {
    const original = nft.image_url || nft.previews.image_large_url;

    return nft.chain === 'solana'
        ? original
        : resolveImageURL(original, nft.name, nft.collection.name, nft.contract_address) || original;
}
