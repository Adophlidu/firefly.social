import { resolveIPFS_URL } from '@/metadata/src/nft/resolveIPFS_URL.js';
import type { Asset } from '@/metadata/src/nft/types.js';

const isArweave = (url: string | undefined) => (url ? url.startsWith('ar://') : false);

export function adjustAssetUris<T extends Asset>(asset: T): T {
    return {
        ...asset,
        image_uri:
            asset.image_uri && !isArweave(asset.image_uri) ? resolveIPFS_URL(asset.image_uri) : asset.nftscan_uri,
        content_uri:
            asset.content_uri && !isArweave(asset.content_uri) ? resolveIPFS_URL(asset.content_uri) : asset.nftscan_uri,
        video_uri:
            asset.content_type?.startsWith('video/') && asset.content_uri
                ? resolveIPFS_URL(asset.content_uri)
                : undefined,
    };
}
