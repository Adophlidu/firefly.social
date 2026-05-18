import { FireflyPlatform } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';

import { BookmarkType } from '@/constants/enum.js';
import { patchPredictionActivityData } from '@/helpers/patchPredictionActivityData.js';
import { useToggleBookmarkMutation } from '@/hooks/useToggleBookmarkMutation.js';
import { bookmark } from '@/providers/firefly/endpoint/bookmark.js';
import { unbookmark } from '@/providers/firefly/endpoint/unbookmark.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

export function useTogglePredictionBookmark() {
    return useToggleBookmarkMutation<BetsActivity>({
        isLoggedIn: !!fireflySessionHolder.session,
        getHasBookmarked: (activity) => activity.hasBookmarked,
        mutationFn: async (activity) => {
            if (activity.hasBookmarked) {
                await unbookmark(activity.transactionHash);
            } else {
                await bookmark(activity.transactionHash, FireflyPlatform.Prediction, undefined, BookmarkType.All);
            }
            patchPredictionActivityData((oldData) => {
                if (oldData.transactionHash === activity.transactionHash) {
                    oldData.hasBookmarked = !activity.hasBookmarked;
                }
            });
        },
        successMessages: {
            add: t`Added to bookmarks`,
            remove: t`Removed from bookmarks`,
        },
        errorMessages: {
            add: t`Failed to add bookmark.`,
            remove: t`Failed to remove bookmark.`,
        },
    });
}
