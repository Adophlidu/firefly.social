import { FireflyPlatform } from '@/constants/enum.js';
import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { DiscoverNFTResponseV3, NFTFeedV3 } from '@/providers/types/NFTs.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

export async function formatNFTsTimelineResponse(
    response: DiscoverNFTResponseV3,
    indicator?: PageIndicator,
): Promise<Pageable<NFTFeedV3, PageIndicator>> {
    const nftIds = response.data.result.map((x) =>
        resolveNFTId(x.chain_id || EthereumChainId.Mainnet, x.contract_address, x.token_id),
    );
    const bookmarks = nftIds.length
        ? await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))
        : [];
    const bookmarksMap = new Map<string, boolean>(
        (bookmarks || []).map((x) => [x.post_id.toLowerCase(), x.has_book_marked]),
    );
    const data = bookmarksMap.size
        ? response.data.result.map<NFTFeedV3>((x) => {
              const id = resolveNFTId(x.chain_id || EthereumChainId.Mainnet, x.contract_address, x.token_id);
              return {
                  ...x,
                  has_bookmarked: bookmarksMap.get(id) || false,
              };
          })
        : response.data.result;
    return createPageable(
        data.map((x) => ({ ...x, detail: x.detail ? adjustAssetUris(x.detail) : null })),
        createIndicator(indicator),
        response.data.cursor && data.length > 0 ? createNextIndicator(undefined, response.data.cursor) : undefined,
    );
}
