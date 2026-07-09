import { KeyType } from '@dimensiondev/enums';
import { SHORT_LINK_HASH_PATTERN } from '@dimensiondev/short-link';

import { shortLinkRedisReader } from '@/libs/ShortLinkRedis.js';

export interface ShortLinkRecord {
    url: string;
    createdAt: number;
}

export function resolveShortLinkKey(hash: string) {
    return `${KeyType.ShortLink}:${hash}`;
}

/** The format guard runs before the lookup so junk paths never reach Redis. */
export async function getShortLink(hash: string): Promise<ShortLinkRecord | null> {
    if (!SHORT_LINK_HASH_PATTERN.test(hash)) return null;
    return shortLinkRedisReader.get<ShortLinkRecord>(resolveShortLinkKey(hash));
}
