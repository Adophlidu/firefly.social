import {
    ARWEAVE_GATEWAY,
    HEY_IMAGEKIT_URL,
    HEY_IPFS_GW_URL,
    IMAGE_KIT_COVER,
    IPFS_GATEWAY,
} from '@dimensiondev/constants/static';

export function sanitizeDStorageUrl(hash?: string, gateway?: string, resize = true) {
    if (!hash) return '';

    if (hash.includes(HEY_IPFS_GW_URL) && resize) {
        return `${HEY_IMAGEKIT_URL}/fallback/${IMAGE_KIT_COVER},q-80/${hash}`;
    }
    return hash
        .replace(/^Qm[1-9A-Za-z]{44}/gm, `${gateway ?? IPFS_GATEWAY}${hash}`)
        .replace('ipfs://ipfs/', gateway ?? IPFS_GATEWAY)
        .replace('ipfs://', gateway ?? IPFS_GATEWAY)
        .replace('ar://', ARWEAVE_GATEWAY);
}
