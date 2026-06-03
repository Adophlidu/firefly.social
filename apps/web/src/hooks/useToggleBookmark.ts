import type { SocialSource } from '@dimensiondev/enums';
import { BookmarkType } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';

import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useToggleBookmarkMutation } from '@/hooks/useToggleBookmarkMutation.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useToggleBookmark(source: SocialSource) {
    const isLogin = useIsLogin(source);
    return useToggleBookmarkMutation<Post>({
        isLoggedIn: isLogin === true,
        openLogin: () => openLoginModalWithGuard({ source }),
        getHasBookmarked: (post) => Boolean(post.hasBookmarked),
        mutationFn: async (post) => {
            const provider = resolveSocialMediaProvider(post.source);
            const result = post.hasBookmarked
                ? await provider.unbookmark(post.postId)
                : await provider.bookmark(
                      post.postId,
                      resolveFireflyPlatformFromSocialSource(post.source),
                      post.author.profileId,
                      BookmarkType.Text,
                  );
            capturePostActionEvent(post.hasBookmarked ? 'unbookmark' : 'bookmark', post);
            return result;
        },
        successMessages: {
            add: t`Post added to your Bookmarks`,
            remove: t`Post removed from your Bookmarks`,
        },
        errorMessages: {
            add: t`Failed to bookmark post.`,
            remove: t`Failed to un-bookmark post.`,
        },
    });
}
