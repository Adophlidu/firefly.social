const didPrefix = 'did:plc:' as const;
type BskyDid = `${typeof didPrefix}${string}`;

export function isBskyDid(str: string): str is BskyDid {
    return str.startsWith(didPrefix);
}
