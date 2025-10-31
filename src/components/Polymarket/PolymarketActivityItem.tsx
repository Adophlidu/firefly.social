import { classNames } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { type CSSProperties, memo } from 'react';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { ActivityCellPolymarketAction } from '@/components/ActivityCell/Polymarket/ActivityCellPolymarketAction.js';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { PolymarketActivityRate } from '@/components/Polymarket/PolymarketActivityRate.js';
import { PolymarketActivityResult } from '@/components/Polymarket/PolymarketActivityResult.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source, WalletProfileCategory } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { formatAmount } from '@/helpers/polymarket.js';
import { resolvePolymarketEventUrl } from '@/helpers/resolvePolymarketEventUrl.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

interface PolymarketActivityProps {
    activity: PolymarketActivity;
    onPolymarketLinkClick?: () => void;
}

export const PolymarketActivityItem = memo<PolymarketActivityProps>(function PolymarketActivityItem({
    activity,
    onPolymarketLinkClick,
}) {
    const isMyProfile = useIsMyRelatedProfile(Source.Wallet, activity.wallet);

    const addressName = formatAddress(activity.wallet, 4);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: activity.wallet }, WalletProfileCategory.Bets);

    const isLeft = activity.outcomeIndex === 0;
    const outcome = activity.conditionOutcomes[activity.outcomeIndex] || activity.outcome;

    const isDarkMode = useIsDarkMode();

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
                <div
                    className="min-w-0 flex-1 overflow-hidden"
                    style={
                        {
                            '--success-color': isDarkMode ? '#1F4B1A' : '#C1E7BD',
                            '--danger-color': isDarkMode ? '#66120D' : '#FFD5D2',
                        } as CSSProperties
                    }
                >
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
                        <ChainIcon chainId={polygon.id} size={15} className="mr-auto shrink-0" />
                        {isMyProfile ? null : (
                            <WalletBaseMoreAction
                                address={activity.wallet as Address}
                                ens={activity.displayInfo?.ensHandle}
                            />
                        )}
                    </div>
                    <Link
                        target="_blank"
                        className="mt-1.5 block flex-1"
                        href={resolvePolymarketEventUrl(activity.eventSlug)}
                        onClick={onPolymarketLinkClick}
                    >
                        <ActivityCellPolymarketAction type={activity.side} usdcSize={activity.usdcSize} />
                        <div className="mt-1.5 rounded-xl border border-line bg-lightBg p-3">
                            <div className="flex gap-x-2">
                                <Image
                                    alt={activity.title}
                                    width={24}
                                    height={24}
                                    className="size-6 shrink-0 rounded-lg"
                                    src={activity.image}
                                />
                                <span className="line-clamp-2 text-sm font-semibold leading-6 text-lightMain">
                                    {activity.title}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-x-1 text-sm font-medium">
                                <span
                                    className={classNames('rounded-lg border px-2 leading-6', {
                                        'border-success text-success': isLeft,
                                        'border-danger text-danger': !isLeft,
                                    })}
                                >
                                    {outcome.toUpperCase()} - {floor(+activity.price * 100)}¢
                                </span>
                                <span className="h-6 rounded-lg bg-lightBottom px-2 leading-6 text-lightMain dark:bg-lightBg">
                                    <Trans>×{formatAmount(activity.size)} shares</Trans>
                                </span>
                            </div>
                            {activity.umaResolutionStatus === 'resolved' ? (
                                <PolymarketActivityResult activity={activity} />
                            ) : (
                                <PolymarketActivityRate activity={activity} />
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
});
