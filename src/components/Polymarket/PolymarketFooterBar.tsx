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
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface PolymarketFooterBarProps {
    activity: PolymarketActivity;
}

export const PolymarketFooterBar = memo<PolymarketFooterBarProps>(function PolymarketFooterBar({ activity }) {
    const identity = useFireflyIdentity(Source.Wallet, activity.wallet as Address);
    const { mutate: toggleBookmark, isPending: isBookmarkPending } = useTogglePolymarketBookmark();

    const { hasBookmarked } = activity;

    const polymarketUrl = `${POLYMARKET_URL}/event/${activity.eventSlug}`;

    const handleBookmark = useCallback(() => {
        toggleBookmark(activity);
    }, [toggleBookmark, activity]);

    return (
        <div className="mt-3 flex items-center justify-between text-second">
            <div className="flex items-center">
                <LikeButton type={Source.Polymarket} data={activity} />
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
