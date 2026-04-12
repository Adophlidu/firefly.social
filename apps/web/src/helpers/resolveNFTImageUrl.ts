import type { EVM } from '@/providers/nftscan/types.js';

export function resolveNFTImageUrl(nft: EVM.Asset) {
    return nft.nftscan_uri || nft.image_uri || nft.imageURL;
}
