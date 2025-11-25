import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { fireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

export function useTogglePolymarketBookmark() {
    return useMutation({
        mutationFn: async (activity: PolymarketActivity) => {
            if (!fireflySessionHolder.session) {
                openLoginModal();
                return;
            }
            const hasBookmarked = activity.hasBookmarked;
            try {
                if (hasBookmarked) {
                    await fireflySocialMediaProvider.unbookmark(activity.transactionHash);
                    enqueueSuccessMessage(t`Removed from bookmarks`);
                } else {
                    await fireflySocialMediaProvider.bookmark(
                        activity.transactionHash,
                        FireflyPlatform.Bets,
                        undefined,
                        BookmarkType.All,
                    );
                    enqueueSuccessMessage(t`Added to bookmarks`);
                }
                queryClient.setQueriesData<{
                    pages: Array<{ data: PolymarketActivity[] }>;
                }>(
                    {
                        queryKey: ['polymarket'],
                    },
                    (old) => {
                        if (!old?.pages) return old;

                        return produce(old, (draft) => {
                            draft.pages.forEach((page) => {
                                page.data.forEach((oldData: PolymarketActivity) => {
                                    if (oldData.transactionHash === activity.transactionHash) {
                                        oldData.hasBookmarked = !hasBookmarked;
                                    }
                                });
                            });
                        });
                    },
                );
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
