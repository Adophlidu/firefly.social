import { BookmarkType, FireflyPlatform } from '@dimensiondev/enums';

import { SetQueryDataForBookmarkToken } from '@/decorators/SetQueryDataForBookmarkToken.js';
import { resolveTokenBookmarkId } from '@/helpers/resolveTokenBookmarkId.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import type { BookmarkTokenOptions } from '@/providers/types/Bookmark.js';

@SetQueryDataForBookmarkToken()
class FireflyBookmark {
    async bookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return bookmark(bookmarkContentId, FireflyPlatform.Token, undefined, BookmarkType.All);
    }

    async unbookmarkToken(options: BookmarkTokenOptions) {
        const bookmarkContentId = resolveTokenBookmarkId(options);
        return unbookmark(bookmarkContentId);
    }
}

export { FireflyBookmark };
export const fireflyBookmarkProvider = new FireflyBookmark();
