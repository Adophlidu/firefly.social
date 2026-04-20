import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';
import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { DiscoverNFTResponseV3, NFTFeedV3 } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function getFollowingNFTs({
    limit = 20,
    indicator,
    chainId,
    walletAddress,
}: {
    limit?: number;
    indicator?: PageIndicator;
    chainId?: number;
    walletAddress?: string;
} = {}): Promise<Pageable<NFTFeedV3, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/timeline/nft');
    const response = await fireflySessionHolder.fetch<DiscoverNFTResponseV3>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                size: limit,
                cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                chainId,
                walletAddress,
            }),
        },
        !walletAddress
            ? {
                  withSession: true,
              }
            : undefined,
    );

    const data = response.data.result.map<NFTFeedV3>((x) => {
        return {
            ...x,
            bookmarked: x.has_bookmarked,
            detail: x.detail ? adjustAssetUris(x.detail) : null,
        };
    });
    return createPageable(
        data,
        createIndicator(indicator),
        response.data.cursor && data.length > 0 ? createNextIndicator(undefined, response.data.cursor) : undefined,
    );
}
