import { IPFS_REGEXP } from '@/constants/regexp.js';

export function isIpfsCID(ipfs: string | undefined) {
    if (!ipfs) return false;
    return IPFS_REGEXP.test(ipfs);
}

export function extractIpfsCID(ipfs: string) {
    return IPFS_REGEXP.exec(ipfs)?.[1];
}
