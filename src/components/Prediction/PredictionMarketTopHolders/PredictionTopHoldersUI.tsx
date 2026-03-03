import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { type BetsTopHolderForUI } from '@/types/prediction.js';

interface PredictionTopHoldersUIProps extends HTMLProps<HTMLDivElement> {
    holders: BetsTopHolderForUI[];
    platform: PredictionPlatform;
    outcomeLabel: string;
    isYes?: boolean;
}

export function PredictionTopHoldersUI({
    holders,
    outcomeLabel,
    isYes,
    platform,
    className,
}: PredictionTopHoldersUIProps) {
    return (
        <div className={classNames('w-full', className)}>
            <span className="pl-4 text-xs font-medium text-second">
                <Trans>{outcomeLabel} Holders</Trans>
            </span>
            {!holders.length ? (
                <div className="pl-4 pt-9 text-left text-xs font-semibold text-second">
                    <Trans>No holders found.</Trans>
                </div>
            ) : null}
            {holders.map((holder) => (
                <Link
                    href={RouteResolver.betsProfile(holder.wallet, { platform })}
                    className="flex items-center gap-2 border-b border-line py-2 pl-4"
                    key={holder.wallet}
                >
                    <Avatar className="shrink-0" src={holder.avatar} size={36} alt={holder.wallet} />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-main">
                            {holder.name || formatAddressEthereum(holder.wallet, 4)}
                        </div>
                        <div className={classNames('text-sm font-semibold', isYes ? 'text-success' : 'text-danger')}>
                            <Trans>{toFixedTrimmed(holder.shares, 1)} Shares</Trans>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
