import { FireflyPlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';

import { resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';
import type { EVM } from '@/providers/nftscan/types.js';

export async function fillBookmarkStatusForNonFungibleAssets(assets: EVM.Asset[]) {
    const nftIds = assets.map((item) => resolveNFTIdFromAsset(item));
    if (!nftIds.length) return assets;

    const bookmarkData = (await runInSafeAsync(() => getFireflyBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || [];

    const bookmarkedIds = new Set(bookmarkData.filter((b) => !!b.has_book_marked).map((b) => b.post_id.toLowerCase()));
    return assets.map((item) => ({
        ...item,
        hasBookmarked: bookmarkedIds.has(resolveNFTIdFromAsset(item).toLowerCase()),
    }));
}
