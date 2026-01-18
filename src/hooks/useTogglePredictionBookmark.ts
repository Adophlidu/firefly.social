import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { patchPredictionActivityData } from '@/helpers/patchPredictionActivityData.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

export function useTogglePredictionBookmark() {
    return useMutation({
        mutationFn: async (activity: BetsActivity) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }
            const hasBookmarked = activity.hasBookmarked;
            try {
                if (hasBookmarked) {
                    await unbookmark(activity.transactionHash);
                    enqueueSuccessMessage(t`Removed from bookmarks`);
                } else {
                    await bookmark(activity.transactionHash, FireflyPlatform.Bets, undefined, BookmarkType.All);
                    enqueueSuccessMessage(t`Added to bookmarks`);
                }
                patchPredictionActivityData((oldData) => {
                    if (oldData.transactionHash === activity.transactionHash) {
                        oldData.hasBookmarked = !hasBookmarked;
                    }
                });
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    hasBookmarked ? t`Failed to remove bookmark.` : t`Failed to add bookmark.`,
                );
                throw error;
            }
        },
    });
}
