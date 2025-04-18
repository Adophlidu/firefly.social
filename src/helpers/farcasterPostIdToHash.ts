import { type ByteArray, toBytes } from 'viem';

export function farcasterPostIdToHash(postId: string): ByteArray {
    return toBytes(postId, {
        size: 20,
    });
}
