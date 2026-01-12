import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { captureArticleBookmarkSuccessEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Article } from '@/providers/types/Article.js';

export function useToggleArticleBookmark() {
    return useMutation({
        mutationFn: async (article: Article) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }

            try {
                if (article.hasBookmarked) {
                    const result = await fireflySocialMediaProvider.unbookmark(article.id);
                    enqueueSuccessMessage(t`Article removed from your Bookmarks`);
                    return result;
                } else {
                    const result = await fireflySocialMediaProvider.bookmark(
                        article.id,
                        FireflyPlatform.Article,
                        article.author.id,
                        BookmarkType.Text,
                    );
                    enqueueSuccessMessage(t`Article added to your Bookmarks`);

                    captureArticleBookmarkSuccessEvent(article.id, fireflySessionHolder.session.profileId);

                    return result;
                }
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    article.hasBookmarked ? t`Failed to un-bookmark article.` : t`Failed to bookmark article.`,
                );
                throw error;
            }
        },
    });
}
