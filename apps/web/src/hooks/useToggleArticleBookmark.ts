import { FireflyPlatform } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';

import { BookmarkType } from '@/constants/enum.js';
import { useToggleBookmarkMutation } from '@/hooks/useToggleBookmarkMutation.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { captureArticleBookmarkSuccessEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { Article } from '@/providers/types/Article.js';

export function useToggleArticleBookmark() {
    return useToggleBookmarkMutation<Article>({
        isLoggedIn: Boolean(fireflySessionHolder.session),
        getHasBookmarked: (article) => Boolean(article.hasBookmarked),
        mutationFn: async (article) => {
            if (article.hasBookmarked) {
                return farcasterSocialMediaProvider.unbookmark(article.id);
            }
            const result = await farcasterSocialMediaProvider.bookmark(
                article.id,
                FireflyPlatform.Article,
                article.author.id,
                BookmarkType.Text,
            );
            const profileId = fireflySessionHolder.session?.profileId;
            if (profileId) captureArticleBookmarkSuccessEvent(article.id, profileId);
            return result;
        },
        successMessages: {
            add: t`Article added to your Bookmarks`,
            remove: t`Article removed from your Bookmarks`,
        },
        errorMessages: {
            add: t`Failed to bookmark article.`,
            remove: t`Failed to un-bookmark article.`,
        },
    });
}
