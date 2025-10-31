import { assert } from '@firefly/utils';

import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';

/**
 * resolve token bookmark content id
 */
export function resolveTokenBookmarkId({ coinId, chainId, address }: BookmarkTokenOptions) {
    assert(
        coinId || (chainId && address),
        `Require coinId or both chainId and address, got: ${JSON.stringify({ coinId, chainId, address })}`,
    );
    return coinId ? coinId : `${chainId}.${address!.toLowerCase()}`;
}
