import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SnapshotActivity } from '@/providers/snapshot/type.js';

export function useToggleSnapshotBookmark() {
    return useMutation({
        mutationFn: async (snapshot: SnapshotActivity) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }

            try {
                if (snapshot.hasBookmarked) {
                    const result = await unbookmark(snapshot.hash);
                    enqueueSuccessMessage(t`Snapshot removed from your Bookmarks`);
                    return result;
                } else {
                    const result = await bookmark(
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
                    snapshot.hasBookmarked ? t`Failed to un-bookmark snapshot.` : t`Failed to bookmark snapshot.`,
                );
                throw error;
            }
        },
    });
}
