import { first } from 'lodash-es';
import { memo, useCallback } from 'react';
import { type Address } from 'viem';

import { Avatar } from '@/components/Avatar.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { Link } from '@/components/Link.js';
import { PredictionActivityAction } from '@/components/Prediction/PredictionActivityAction.js';
import { PredictionActivityBody } from '@/components/Prediction/PredictionActivityBody.js';
import { PredictionPlatformIcon } from '@/components/Prediction/PredictionPlatformIcon.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source, WalletProfileCategory } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionActivityItemProps {
    activity: BetsActivity;
    onLinkClick?: () => void;
}

export const PredictionActivityItem = memo<PredictionActivityItemProps>(function PredictionActivityItem({
    activity,
    onLinkClick,
}) {
    const walletAddress = activity.wallet || activity.proxyWallet;
    const isMyProfile = useIsMyRelatedProfile(Source.Wallet, walletAddress);

    const addressName = formatAddress(walletAddress, 4);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: walletAddress }, WalletProfileCategory.Bets);

    const wrapper = useCallback(
        (children: React.ReactNode) => (
            <Link
                href={
                    activity.topicId
                        ? RouteResolver.betsEventDetail(activity.platform, activity.topicId, {
                              multiple: activity.isMutil === 1,
                          })
                        : activity.url
                }
                onClick={onLinkClick}
            >
                {children}
            </Link>
        ),
        [activity.platform, activity.topicId, activity.isMutil, activity.url, onLinkClick],
    );

    return (
        <div className="border-b border-line px-4 py-3">
            {activity.followingSources?.length ? <FeedFollowSource source={first(activity.followingSources)} /> : null}
            <div className="flex gap-x-3">
                <div>
                    <Link href={profileUrl}>
                        <Avatar
                            alt={walletAddress}
                            className="size-10 rounded-full"
                            src={getWalletProfileAvatar(activity.displayInfo)}
                            size={40}
                        />
                    </Link>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-x-1 text-medium text-second">
                        <Link href={profileUrl} className="min-w-0 truncate font-bold text-lightMain">
                            {activity.displayInfo?.ensHandle || addressName}
                        </Link>
                        {activity.displayInfo?.ensHandle ? (
                            <Link href={profileUrl} className="ml-2 max-md:hidden">
                                {addressName}
                            </Link>
                        ) : null}
                        {activity.timestamp ? (
                            <span className="whitespace-nowrap pl-1">
                                · <TimestampFormatter time={activity.timestamp * 1000} /> ·
                            </span>
                        ) : null}
                        <PredictionPlatformIcon platform={activity.platform} size={15} className="mr-auto shrink-0" />
                        {isMyProfile ? null : (
                            <WalletBaseMoreAction
                                address={walletAddress as Address}
                                ens={activity.displayInfo?.ensHandle ?? undefined}
                            />
                        )}
                    </div>
                    <PredictionActivityBody activity={activity} wrapper={wrapper} />

                    <PredictionActivityAction activity={activity} />
                </div>
            </div>
        </div>
    );
});
