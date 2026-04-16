'use client';

import { classNames } from '@dimensiondev/utils';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';

import { Avatar } from '@/components/Avatar.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { multipliedBy } from '@/helpers/number.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { resolveBetActivityTraderInfo } from '@/helpers/resolveTraderInfoForBetActivity.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionTradeTimelineItemProps {
    trade: BetsActivity;
    platform: PredictionPlatform;
}

export function PredictionTradeTimelineItem({ trade, platform }: PredictionTradeTimelineItemProps) {
    const walletAddress = trade.proxyWallet || trade.wallet;
    const addressName = formatAddress(walletAddress, 4);
    const betsProfileUrl = RouteResolver.betsProfile(walletAddress, { platform });
    const marketTitle =
        platform === PredictionPlatform.Polymarket ? trade.rawData?.groupItemTitle || trade.title : trade.title;
    const usdValue = multipliedBy(trade.size, trade.price).toNumber();
    const { displayName, avatarUrl, source } = resolveBetActivityTraderInfo(trade);

    return (
        <div className="border-line flex items-center gap-2 border-b px-4 py-3">
            <Link href={betsProfileUrl} target="_blank" className="relative">
                <Avatar src={avatarUrl} size={36} alt={walletAddress} />
                {isSocialSource(source) ? (
                    <ProfileSourceIcon
                        source={source}
                        size={16}
                        className="absolute -bottom-1 -right-2 z-10 size-4 rounded-full border border-white"
                    />
                ) : null}
            </Link>
            <div className="text-second text-sm font-medium">
                {trade.side === 'buy' ? (
                    <Trans>
                        <Link href={betsProfileUrl} target="_blank" className="text-main hover:underline">
                            {displayName}
                        </Link>{' '}
                        Bought{' '}
                        <span
                            className={classNames(
                                'font-semibold',
                                trade.outcomeIndex === 0 ? 'text-success' : 'text-danger',
                            )}
                        >{`${toFixedTrimmed(+trade.size, 2)} ${trade.outcome}`}</span>{' '}
                        for <span className="text-main">{marketTitle}</span> at{' '}
                        <span className="text-main">{`${toFixedTrimmed(+trade.price * 100, 1)}¢`}</span>{' '}
                        <span className="inline-block">
                            {`(${usdValue < 0.01 ? '< $0.01' : `$${toFixedTrimmed(usdValue, 2)}`})`}
                        </span>
                    </Trans>
                ) : (
                    <Trans>
                        <Link href={betsProfileUrl} target="_blank" className="text-main hover:underline">
                            {trade.displayInfo?.ensHandle || addressName}
                        </Link>{' '}
                        Sold{' '}
                        <span
                            className={classNames(
                                'font-semibold',
                                trade.outcomeIndex === 0 ? 'text-success' : 'text-danger',
                            )}
                        >{`${toFixedTrimmed(+trade.size, 2)} ${trade.outcome}`}</span>{' '}
                        for <span className="text-main">{marketTitle}</span> at{' '}
                        <span className="text-main">{`${toFixedTrimmed(+trade.price * 100, 1)}¢`}</span>{' '}
                        <span className="inline-block">
                            {`(${usdValue < 0.01 ? '< $0.01' : `$${toFixedTrimmed(usdValue, 2)}`})`}
                        </span>
                    </Trans>
                )}
            </div>
        </div>
    );
}
