import { memo, useCallback } from 'react';
import { type Address } from 'viem';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { ShareAction } from '@/components/Actions/ShareAction.js';
import { Tips } from '@/components/Tips/index.js';
import { Source } from '@/constants/enum.js';
import { POLYMARKET_URL } from '@/constants/static.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useTogglePredictionBookmark } from '@/hooks/useTogglePredictionBookmark.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionActivityActionProps {
    activity: BetsActivity;
}

export const PredictionActivityAction = memo<PredictionActivityActionProps>(function PredictionActivityAction({
    activity,
}) {
    const walletAddress = activity.wallet || activity.proxyWallet || activity.owner;
    const identity = useFireflyIdentity(Source.Wallet, walletAddress as Address);
    const { mutate: toggleBookmark, isPending: isBookmarkPending } = useTogglePredictionBookmark();

    const { hasBookmarked, has_bookmarked } = activity;

    const polymarketUrl = activity.rawData?.slug
        ? `${POLYMARKET_URL}/event/${activity.rawData.slug}`
        : (activity.url ?? '');

    const handleBookmark = useCallback(() => {
        toggleBookmark(activity);
    }, [toggleBookmark, activity]);

    return (
        <div className="mt-3 flex items-center justify-between text-second">
            <div className="flex items-center">
                <LikeButton type={Source.Prediction} data={activity} />
            </div>

            <div className="flex items-center gap-2">
                <Bookmark
                    hasBookmarked={hasBookmarked || has_bookmarked}
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
