import { FireflyPlatform } from '@/constants/enum.js';
import { resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';
import { type EVM } from '@/providers/nftscan/types.js';

export async function fillBookmarkStatusForNonFungibleAssets(assets: EVM.Asset[]) {
    const nftIds = assets.map((item) => resolveNFTIdFromAsset(item));
    if (!nftIds.length) return assets;

    const bookmarkData = (await runInSafeAsync(() => getFireflyBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || [];

    return assets.map((item) => ({
        ...item,
        hasBookmarked: bookmarkData.some(
            (bookmark) => bookmark.post_id.toLowerCase() === resolveNFTIdFromAsset(item) && !!bookmark.has_book_marked,
        ),
    }));
}
