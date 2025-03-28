import { FireflyPlatform } from '@/constants/enum.js';
import { resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { NonFungibleAsset } from '@/mask_pkgs/web3-shared/base/index.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export async function fillBookmarkStatusForNonFungibleAssets(assets: Array<NonFungibleAsset<number, number>>) {
    const nftIds = assets.map((item) => resolveNFTIdFromAsset(item));
    if (!nftIds.length) return assets;

    const bookmarkData =
        (await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))) || [];

    return assets.map((item) => ({
        ...item,
        hasBookmarked: bookmarkData.some(
            (bookmark) => bookmark.post_id.toLowerCase() === resolveNFTIdFromAsset(item) && !!bookmark.has_book_marked,
        ),
    }));
}
