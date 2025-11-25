import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { SetQueryDataForBookmarkNFT } from '@/decorators/SetQueryDataForBookmarkNFT.js';
import { SetQueryDataForBookmarkToken } from '@/decorators/SetQueryDataForBookmarkToken.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';

@SetQueryDataForBookmarkNFT()
@SetQueryDataForBookmarkToken()
class FireflyBookmark {
    async bookmarkNFT(nftId: string, owner?: string): Promise<boolean> {
        return fireflySocialMediaProvider.bookmark(nftId, FireflyPlatform.NFTs, owner, BookmarkType.All);
    }

    async unbookmarkNFT(nftId: string, owner?: string): Promise<boolean> {
        return fireflySocialMediaProvider.unbookmark(nftId);
    }

    async bookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return fireflySocialMediaProvider.bookmark(
            bookmarkContentId,
            FireflyPlatform.Token,
            undefined,
            BookmarkType.All,
        );
    }

    async unbookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return fireflySocialMediaProvider.unbookmark(bookmarkContentId);
    }
}

export { FireflyBookmark };
export const fireflyBookmarkProvider = new FireflyBookmark();
