import { type EVM } from '@/providers/nft-scan/types.js';
import { resolveIPFS_URL } from '@/web3-shared/base/resolver.js';

const isArweave = (url: string | undefined) => (url ? url.startsWith('ar://') : false);

export function adjustAssetUris<T extends EVM.Asset>(asset: T): T {
    return {
        ...asset,
        image_uri:
            asset.image_uri && !isArweave(asset.image_uri) ? resolveIPFS_URL(asset.image_uri) : asset.nftscan_uri,
        content_uri:
            asset.content_uri && !isArweave(asset.image_uri) ? resolveIPFS_URL(asset.image_uri) : asset.nftscan_uri,
        video_uri:
            asset.content_type?.startsWith('video/') && asset.content_uri
                ? resolveIPFS_URL(asset.content_uri)
                : undefined,
    };
}
