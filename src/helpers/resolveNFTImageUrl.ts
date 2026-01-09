import { type EVM } from '@/providers/nft-scan/types.js';

export function resolveNFTImageUrl(nft: EVM.Asset) {
    return nft.nftscan_uri || nft.image_uri || nft.imageURL;
}
