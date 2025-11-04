import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { createIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { DiscoverNFTResponseV3, NFTFeedV3 } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function discoverNFTs({
    indicator,
    limit = 20,
    chainId,
}: {
    indicator?: PageIndicator;
    limit?: number;
    chainId?: number;
} = {}) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/nft/v3', {
        size: limit,
        chainId,
        cursor: indicator?.id,
    });
    const response = await fireflySessionHolder.fetch<DiscoverNFTResponseV3>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);
    const feeds = data.result.map<NFTFeedV3>((feed) => ({
        ...feed,
        bookmarked: feed.has_bookmarked,
        detail: feed.detail ? adjustAssetUris(feed.detail) : null,
    }));
    return createPageable(
        feeds,
        createIndicator(indicator),
        data.cursor ? createIndicator(undefined, data.cursor) : undefined,
    );
}
