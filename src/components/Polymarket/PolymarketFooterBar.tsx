import { memo, useCallback } from 'react';
import type { Address } from 'viem';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { ShareAction } from '@/components/Actions/ShareAction.js';
import { Tips } from '@/components/Tips/index.js';
import { Source } from '@/constants/enum.js';
import { POLYMARKET_URL } from '@/constants/index.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useTogglePolymarketBookmark } from '@/hooks/useTogglePolymarketBookmark.js';
import { useTogglePolymarketLike } from '@/hooks/useTogglePolymarketLike.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface PolymarketFooterBarProps {
    activity: PolymarketActivity;
}

export const PolymarketFooterBar = memo<PolymarketFooterBarProps>(function PolymarketFooterBar({ activity }) {
    const identity = useFireflyIdentity(Source.Wallet, activity.wallet as Address);
    const { mutate: toggleLike, isPending: isLikePending } = useTogglePolymarketLike();
    const { mutate: toggleBookmark, isPending: isBookmarkPending } = useTogglePolymarketBookmark();

    const { isLiked, likeCount, hasBookmarked } = activity;

    const polymarketUrl = `${POLYMARKET_URL}/event/${activity.eventSlug}`;

    const handleLike = useCallback(() => {
        toggleLike({ activity, isLiked, likeCount });
    }, [toggleLike, activity, isLiked, likeCount]);

    const handleBookmark = useCallback(() => {
        toggleBookmark(activity);
    }, [toggleBookmark, activity]);

    return (
        <div className="mt-3 flex items-center justify-between text-second">
            <div className="flex items-center">
                <LikeButton isLiked={isLiked} likeCount={likeCount} onClick={handleLike} isPending={isLikePending} />
            </div>

            <div className="flex items-center gap-2">
                <Bookmark
                    hasBookmarked={hasBookmarked}
                    onClick={handleBookmark}
                    hiddenCount
                    loading={isBookmarkPending}
                />

                <Tips
                    identity={identity}
                    handle={activity.displayInfo?.ensHandle}
                    className="hover:bg-fireflyBrand/[.20] inline-flex size-7 items-center justify-center rounded-full"
                    tooltipDisabled
                    pureWallet
                />
                <ShareAction link={polymarketUrl} />
            </div>
        </div>
    );
});
