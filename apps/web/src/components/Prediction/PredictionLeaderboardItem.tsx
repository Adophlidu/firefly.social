'use client';

import MedalBronzeIcon from '@dimensiondev/assets/medal-bronze.svg';
import MedalGoldIcon from '@dimensiondev/assets/medal-gold.svg';
import MedalSilverIcon from '@dimensiondev/assets/medal-silver.svg';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { isNil } from 'lodash-es';
import { memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { humanize } from '@/helpers/formatCommentCounts.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { PolymarketRankItem } from '@/providers/firefly/prediction/getPolymarketRank.js';

interface PredictionLeaderboardItemProps {
    item: PolymarketRankItem;
    rank: number;
    showPnLRate?: boolean;
}

function getMedalIcon(rank: number) {
    if (rank === 1) {
        return <MedalGoldIcon className="size-4" />;
    }
    if (rank === 2) {
        return <MedalSilverIcon className="size-4" />;
    }
    if (rank === 3) {
        return <MedalBronzeIcon className="size-4" />;
    }
    return null;
}

export const PredictionLeaderboardItem = memo<PredictionLeaderboardItemProps>(function PredictionLeaderboardItem({
    item,
    rank,
    showPnLRate = false,
}) {
    const address = item.proxy || item.wallet;
    const avatarUrl = item.displayInfo?.avatarUrl || getStampAvatarByProfileId(Source.Wallet, address, 36);
    const displayName =
        item.displayInfo?.fireflyName ||
        item.polymarketUserName ||
        item.displayInfo?.ensHandle ||
        formatAddressEthereum(address, 4);
    const medal = getMedalIcon(rank);

    const pnlNumber = Number(item.pnl);
    const pnlFormatted = humanize(Math.trunc(Math.abs(pnlNumber)));
    const pnlSign = pnlNumber >= 0 ? '+' : '-';
    const pnlValue = `${pnlSign}$${pnlFormatted}`;

    const rateValue = !isNil(item.pnl_rate)
        ? typeof item.pnl_rate === 'string'
            ? Number.parseFloat(item.pnl_rate)
            : item.pnl_rate
        : null;
    const rate = !isNil(rateValue) && !Number.isNaN(rateValue) ? Math.max(-100, rateValue * 100) : null;
    const pnlRateValue = !isNil(rate) ? `${rate.toFixed(2)}%` : '-';
    const pnlRateColorClass = !isNil(rate) ? (rate >= 0 ? 'text-success' : 'text-danger') : 'text-success';

    const volumeNumber = Number(item.volume);
    const volumeFormatted = humanize(Math.trunc(Math.abs(volumeNumber)));
    const volumeValue = `$${volumeFormatted}`;

    const profileLink = RouteResolver.betsProfile(address, {
        platform: PredictionPlatform.Polymarket,
    });

    return (
        <div className="flex items-center gap-2 px-0 py-3">
            <div className="flex w-[30px] shrink-0 items-center justify-center">
                <span className="text-lightMain text-base font-bold leading-5">{rank}</span>
            </div>
            <Link href={profileLink} className="flex flex-1 items-center gap-2" data-disable-progress>
                <div className="relative shrink-0">
                    <Avatar size={36} src={avatarUrl} alt={displayName} className="rounded-full" />
                    {medal ? <div className="absolute -bottom-1 right-0">{medal}</div> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-lightMain max-w-[100px] truncate text-[13px] font-semibold leading-5">
                        {displayName}
                    </span>
                    {displayName ? (
                        <span className="text-lightSecond text-xs leading-[14px]">
                            {formatAddressEthereum(address, 4)}
                        </span>
                    ) : null}
                </div>
            </Link>
            <div className="flex items-center gap-2">
                <div className="flex w-[120px] shrink-0 flex-col items-end justify-center">
                    <span className="text-lightMain whitespace-nowrap text-[13px] font-medium leading-5">
                        {pnlValue}
                    </span>
                </div>
                {showPnLRate ? (
                    <div className="flex w-[80px] shrink-0 flex-col items-end">
                        <span
                            className={classNames(
                                'whitespace-nowrap text-[13px] font-medium leading-5',
                                pnlRateColorClass,
                            )}
                        >
                            {pnlRateValue}
                        </span>
                    </div>
                ) : null}
                <div className="flex w-[100px] shrink-0 flex-col items-end justify-center">
                    <span className="text-second whitespace-nowrap text-[11px] font-medium leading-5">
                        {volumeValue}
                    </span>
                </div>
            </div>
        </div>
    );
});
