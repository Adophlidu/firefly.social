import { first } from 'lodash-es';
import { memo, useCallback } from 'react';
import type { Address } from 'viem';

import { Avatar } from '@/components/Avatar.js';
import { BetsActivityAction } from '@/components/Bets/BetsActivityAction.js';
import { BetsActivityBody } from '@/components/Bets/BetsActivityBody.js';
import { BetsIcon } from '@/components/Bets/BetsIcon.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { Link } from '@/components/Link.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source, WalletProfileCategory } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface BetsActivityItemProps {
    activity: BetsActivity;
    onLinkClick?: () => void;
}

export const BetsActivityItem = memo<BetsActivityItemProps>(function BetsActivityItem({ activity, onLinkClick }) {
    const isMyProfile = useIsMyRelatedProfile(Source.Wallet, activity.wallet);

    const addressName = formatAddress(activity.wallet, 4);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: activity.wallet }, WalletProfileCategory.Bets);

    const wrapper = useCallback(
        (children: React.ReactNode) => (
            <Link target="_blank" href={activity.url} onClick={onLinkClick}>
                {children}
            </Link>
        ),
        [activity.url, onLinkClick],
    );

    return (
        <div className="border-b border-line px-4 py-3">
            {activity.followingSources?.length ? <FeedFollowSource source={first(activity.followingSources)} /> : null}
            <div className="flex gap-x-3">
                <div>
                    <Link href={profileUrl}>
                        <Avatar
                            alt={activity.wallet}
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
                        <BetsIcon platform={activity.platform} size={15} className="mr-auto shrink-0" />
                        {isMyProfile ? null : (
                            <WalletBaseMoreAction
                                address={activity.wallet as Address}
                                ens={activity.displayInfo?.ensHandle}
                            />
                        )}
                    </div>
                    <BetsActivityBody activity={activity} wrapper={wrapper} />

                    <BetsActivityAction activity={activity} />
                </div>
            </div>
        </div>
    );
});
