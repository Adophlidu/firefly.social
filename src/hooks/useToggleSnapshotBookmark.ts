import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SnapshotActivity } from '@/providers/snapshot/type.js';

export function useToggleSnapshotBookmark() {
    return useMutation({
        mutationFn: async (snapshot: SnapshotActivity) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }
            const { hasBookmarked } = snapshot;

            try {
                if (hasBookmarked) {
                    const result = await farcasterSocialMediaProvider.unbookmark(snapshot.hash);
                    enqueueSuccessMessage(t`Snapshot removed from your Bookmarks`);
                    return result;
                } else {
                    const result = await farcasterSocialMediaProvider.bookmark(
                        snapshot.hash,
                        FireflyPlatform.DAOs,
                        snapshot.author.id,
                        BookmarkType.Text,
                    );
                    enqueueSuccessMessage(t`Snapshot added to your Bookmarks`);
                    return result;
                }
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    hasBookmarked ? t`Failed to un-bookmark snapshot.` : t`Failed to bookmark snapshot.`,
                );
                throw error;
            }
        },
    });
}
