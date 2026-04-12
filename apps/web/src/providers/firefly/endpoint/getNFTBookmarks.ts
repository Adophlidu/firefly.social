import { EMPTY_LIST } from '@dimensiondev/constants';
import { compact, groupBy } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType } from '@/constants/enum.js';
import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { getNFTDetails } from '@/providers/firefly/nft/getNFTDetails.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nftscan/constants.js';
import type { BookmarkResponse, NFTBookmarkContent, NFTDetail } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

type ParamTuple = [chainId: number, address: string, tokenId: string];

function groupNFTParamsByChainId(nftIds: string[]) {
    const tuples = nftIds.map((nftId) => {
        const parts = nftId.split('.');
        const chainId = Number.parseInt(parts[0], 10);
        if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;
        return [chainId, parts[1], parts[2]] as ParamTuple;
    });

    return groupBy(compact(tuples), (x) => x[0]);
}

export async function getNFTBookmarks(indicator?: PageIndicator): Promise<
    Pageable<
        {
            id: string;
            nft: NFTDetail;
        },
        PageIndicator
    >
> {
    const session = getSessionFromStorage(SessionType.Farcaster);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
        post_type: BookmarkType.All,
        platforms: 'nft',
        limit: 25,
        cursor: indicator?.id || undefined,
        fid: session?.profileId,
    });

    const response = await fireflySessionHolder.fetch<BookmarkResponse<NFTBookmarkContent>>(url);
    const data = resolveFireflyResponseData(response);

    const nftIds = data.list.map((x) => x.post_id);
    const groups = groupNFTParamsByChainId(nftIds);
    const promises = Object.entries(groups).map(([chainId, tuples]) => {
        return getNFTDetails(
            +chainId,
            tuples.map((x) => {
                return { contract_address: x[1], token_id: x[2] };
            }),
        );
    });
    const allNfts = await Promise.allSettled(promises);
    const list = allNfts.flatMap((x) => (x.status === 'fulfilled' ? x.value : EMPTY_LIST));
    const nftMap = new Map(list.map((x) => [resolveNFTIdFromAsset(x), x]));

    return createPageable(
        compact(
            nftIds.map((id) => {
                const nft = nftMap.get(id.toLowerCase());
                return nft ? { id, nft: adjustAssetUris(nft) } : null;
            }),
        ),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
