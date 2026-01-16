import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';

import { BookmarkType, type SocialSource, Source } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export function useToggleBookmark(source: SocialSource) {
    const isLogin = useIsLogin(source);
    return useMutation({
        mutationFn: async (post: Post) => {
            if (!isLogin) {
                openLoginModal({ source: post.source });
                return;
            }

            const { hasBookmarked, postId } = post;

            try {
                const provider = [Source.Lens, Source.Twitter].includes(post.source)
                    ? resolveSocialMediaProvider(post.source)
                    : fireflySocialMediaProvider;
                const result = hasBookmarked
                    ? await provider.unbookmark(postId)
                    : await provider.bookmark(
                          postId,
                          resolveFireflyPlatformFromSocialSource(post.source),
                          post.author.profileId,
                          BookmarkType.Text,
                      );
                capturePostActionEvent(hasBookmarked ? 'unbookmark' : 'bookmark', post);
                enqueueSuccessMessage(
                    hasBookmarked ? t`Post removed from your Bookmarks` : t`Post added to your Bookmarks`,
                );
                return result;
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    hasBookmarked ? t`Failed to un-bookmark post.` : t`Failed to bookmark post.`,
                );
                throw error;
            }
        },
    });
}
