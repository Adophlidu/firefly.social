import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { Avatar } from '@/components/Avatar.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { multipliedBy } from '@/helpers/number.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface PredictionTradeTimelineItemProps {
    trade: BetsActivity;
    platform: PredictionPlatform;
}

export function PredictionTradeTimelineItem({ trade, platform }: PredictionTradeTimelineItemProps) {
    const walletAddress = trade.proxyWallet || trade.wallet;
    const addressName = formatAddress(walletAddress, 4);
    const avatarUrl = trade.displayInfo?.avatarUrl || getStampAvatarByProfileId(Source.Wallet, walletAddress);
    const betsProfileUrl = RouteResolver.betsProfile(walletAddress, { platform });
    const marketTitle =
        platform === PredictionPlatform.Polymarket ? trade.rawData?.groupItemTitle || trade.title : trade.title;
    const usdValue = multipliedBy(trade.size, trade.price).toNumber();

    return (
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Link href={betsProfileUrl} target="_blank">
                <Avatar src={avatarUrl} size={36} alt={walletAddress} />
            </Link>
            <div className="text-sm font-medium text-second">
                {trade.side === 'buy' ? (
                    <Trans>
                        <Link href={betsProfileUrl} target="_blank" className="text-main hover:underline">
                            {trade.displayInfo?.ensHandle || addressName}
                        </Link>{' '}
                        Bought{' '}
                        <span
                            className={classNames(
                                'font-semibold',
                                trade.outcomeIndex === 0 ? 'text-success' : 'text-danger',
                            )}
                        >{`${toFixedTrimmed(+trade.size, 2)} ${trade.outcome}`}</span>{' '}
                        for <span className="text-main">{marketTitle}</span> at{' '}
                        <span className="text-main">{`${toFixedTrimmed(+trade.price * 100, 1)}¢`}</span>
                        {` (${usdValue < 0.01 ? '< $0.01' : `$${toFixedTrimmed(usdValue, 2)}`})`}
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
                        <span className="text-main">{`${toFixedTrimmed(+trade.price * 100, 1)}¢`}</span>
                        {` (${usdValue < 0.01 ? '< $0.01' : `$${toFixedTrimmed(usdValue, 2)}`})`}
                    </Trans>
                )}
            </div>
        </div>
    );
}
