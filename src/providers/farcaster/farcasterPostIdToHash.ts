export function farcasterPostIdToHash(postId: string) {
    const hexWithoutPrefix = postId.startsWith('0x') ? postId.slice(2) : postId;
    const uint8Array = new Uint8Array(hexWithoutPrefix.length / 2);

    for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        const byteValue = Number.parseInt(hexWithoutPrefix.substr(i, 2), 16);
        uint8Array[i / 2] = byteValue;
    }
    return uint8Array;
}
