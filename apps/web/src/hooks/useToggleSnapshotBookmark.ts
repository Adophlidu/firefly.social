import { BookmarkType, FireflyPlatform } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';

import { useToggleBookmarkMutation } from '@/hooks/useToggleBookmarkMutation.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';

export function useToggleSnapshotBookmark() {
    return useToggleBookmarkMutation<SnapshotActivity>({
        isLoggedIn: !!fireflySessionHolder.session,
        getHasBookmarked: (snapshot) => snapshot.hasBookmarked,
        mutationFn: async (snapshot) => {
            if (snapshot.hasBookmarked) {
                return farcasterSocialMediaProvider.unbookmark(snapshot.hash);
            }
            return farcasterSocialMediaProvider.bookmark(
                snapshot.hash,
                FireflyPlatform.DAOs,
                snapshot.author.id,
                BookmarkType.Text,
            );
        },
        successMessages: {
            add: t`Snapshot added to your Bookmarks`,
            remove: t`Snapshot removed from your Bookmarks`,
        },
        errorMessages: {
            add: t`Failed to bookmark snapshot.`,
            remove: t`Failed to un-bookmark snapshot.`,
        },
    });
}
