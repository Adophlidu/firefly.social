'use client';

import { classNames } from '@dimensiondev/utils';
import { isNil } from 'lodash-es';
import { memo } from 'react';

import MedalBronzeIcon from '@/assets/medal-bronze.svg';
import MedalGoldIcon from '@/assets/medal-gold.svg';
import MedalSilverIcon from '@/assets/medal-silver.svg';
import { Avatar } from '@/components/Avatar.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { PolymarketRankItem } from '@/providers/firefly/bets/getPolymarketRank.js';

interface BetsLeaderboardItemProps {
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

export const BetsLeaderboardItem = memo<BetsLeaderboardItemProps>(function BetsLeaderboardItem({
    item,
    rank,
    showPnLRate = false,
}) {
    const address = item.owner || item.wallet;
    const avatarUrl = item.displayInfo?.avatarUrl || getStampAvatarByProfileId(Source.Wallet, address, 36);
    const displayName = item.displayInfo?.fireflyName || item.polymarketUserName || formatAddressEthereum(address, 4);
    const medal = getMedalIcon(rank);

    const pnlValue = formatPolymarketNumber(Number(item.pnl), {
        prefix: '$',
        symbol: true,
    });

    const rateValue = !isNil(item.pnl_rate)
        ? typeof item.pnl_rate === 'string'
            ? Number.parseFloat(item.pnl_rate)
            : item.pnl_rate
        : null;
    const rate = !isNil(rateValue) && !Number.isNaN(rateValue) ? rateValue * 100 : null;
    const pnlRateValue = !isNil(rate)
        ? `${formatPolymarketNumber(rate, { prefix: '', symbol: false, digits: 2 })}%`
        : '-';
    const pnlRateColorClass = !isNil(rate) ? (rate >= 0 ? 'text-success' : 'text-danger') : 'text-success';

    const volumeValue = formatPolymarketNumber(Number(item.volume), {
        prefix: '$',
        symbol: false,
    });

    return (
        <div className="flex items-center gap-2 px-0 py-3">
            <div className="flex w-[30px] shrink-0 items-center justify-center">
                <span className="text-base font-bold leading-5 text-lightMain">{rank}</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
                <div className="relative shrink-0">
                    <Avatar size={36} src={avatarUrl} alt={displayName} className="rounded-full" />
                    {medal ? <div className="absolute -bottom-1 right-0">{medal}</div> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="max-w-[100px] truncate text-[13px] font-semibold leading-5 text-lightMain">
                        {item.polymarketUserName || formatAddressEthereum(address, 4)}
                    </span>
                    {item.polymarketUserName ? (
                        <span className="text-lightSecond text-xs leading-[14px]">
                            {formatAddressEthereum(address, 4)}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex w-[120px] shrink-0 flex-col items-end justify-center">
                    <span className="whitespace-nowrap text-[13px] font-medium leading-5 text-lightMain">
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
                    <span className="text-lightSecond whitespace-nowrap text-[11px] font-medium leading-5">
                        {volumeValue}
                    </span>
                </div>
            </div>
        </div>
    );
});
