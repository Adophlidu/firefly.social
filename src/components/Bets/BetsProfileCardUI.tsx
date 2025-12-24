'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { BetsIcon } from '@/components/Bets/BetsIcon.js';
import { BetsName } from '@/components/Bets/BetsName.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { Link } from '@/esm/Link.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { capturePolymarketProfileLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetPortfolioItem } from '@/providers/types/Firefly.js';

interface BetsProfileCardUIProps {
    profile: BetPortfolioItem;
}

export const BetsProfileCardUI = memo<BetsProfileCardUIProps>(function BetsProfileCard({ profile }) {
    return (
        <Link
            className="flex justify-evenly gap-3 rounded-xl bg-primaryBottom p-3"
            href={RouteResolver.betsProfile(profile.proxy, {
                platform: profile.platform,
            })}
            onClick={() => capturePolymarketProfileLinkClick()}
            data-disable-progress
        >
            <div className="flex flex-1 items-center gap-2 text-main">
                <BetsIcon platform={profile.platform} className="shrink-0 rounded-full" size={32} />
                <div className="flex h-9 w-28 flex-col items-start">
                    <div className="w-full shrink-0 truncate text-sm font-semibold">
                        {profile.platform_name || <BetsName platform={profile.platform} />}
                    </div>
                    <div className="ml-auto flex items-center text-[13px] font-medium text-second">
                        {formatAddressEthereum(profile.proxy, 4, 2)}
                        <CopyTextButton
                            className="ml-2 text-second"
                            size={14}
                            text={profile.proxy}
                            data-prevent-progress
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex h-9 flex-1 shrink-0 flex-col items-end justify-between gap-1">
                <div className="text-xs text-second">
                    <Trans>Portfolio</Trans>
                </div>
                <div className="relative text-sm font-semibold text-main">
                    {`$${profile ? formatPrice(profile.balance.toFixed(4)) : '-'}`}
                </div>
            </div>
            <div className="flex h-9 flex-1 shrink-0 flex-col items-end justify-between gap-1">
                <div className="text-xs text-second">
                    <Trans>PnL</Trans>
                </div>
                <div className="relative text-success">
                    <span
                        className={`text-sm font-semibold ${
                            !profile ? '' : profile.pnl < 0 ? 'text-danger' : 'text-success'
                        }`}
                    >
                        {formatPolymarketNumber(profile?.pnl, { symbol: true })}
                        {/* <span className="ml-0.5 text-xs font-normal">{toRate(profile?.pnl_rate)}</span> */}
                    </span>
                </div>
            </div>
        </Link>
    );
});
