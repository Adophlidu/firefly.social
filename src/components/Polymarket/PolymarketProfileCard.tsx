'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import PolymarketIcon from '@/assets/polymarket.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { toRate } from '@/components/Polymarket/toRate.js';
import { Link } from '@/esm/Link.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getProfile } from '@/providers/firefly/polymarket/getProfile.js';
import { capturePolymarketProfileLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface PolymarketProfileCardProps {
    address: string;
}

export const PolymarketProfileCard = memo<PolymarketProfileCardProps>(function PolymarketProfileCard({ address }) {
    const { isLoading, data } = useQuery({
        queryKey: ['polymarket', 'profile', address.toLowerCase()],
        staleTime: 1000 * 60 * 5,
        queryFn: () => getProfile(address),
    });

    if (isLoading)
        return (
            <div className="flex animate-pulse justify-evenly gap-3 rounded-xl bg-primaryBottom p-3">
                <div className="flex flex-1 items-center gap-2 text-main">
                    <div className="size-8 shrink-0 rounded-full bg-third" />
                    <div className="flex h-9 flex-col justify-between">
                        <div className="h-4 w-[96px] shrink-0 rounded-[4px] bg-third" />
                        <div className="flex h-4 w-[64px] items-center rounded-[4px] bg-third" />
                    </div>
                </div>
                <div className="flex h-9 flex-1 flex-col items-end justify-between">
                    <div className="h-4 w-[64px] shrink-0 rounded-[4px] bg-third" />
                    <div className="ml-auto flex h-4 w-[128px] items-center rounded-[4px] bg-third" />
                </div>
                <div className="flex h-9 flex-1 flex-col items-end justify-between">
                    <div className="h-4 w-[64px] shrink-0 rounded-[4px] bg-third text-sm font-semibold" />
                    <div className="ml-auto flex h-4 w-[128px] items-center rounded-[4px] bg-third" />
                </div>
            </div>
        );

    // TODO: maybe a better way to optimize CLS
    if (!data) return null;

    return (
        <Link
            className="flex justify-evenly gap-3 rounded-xl bg-primaryBottom p-3"
            href={RouteResolver.polymarketProfile(data.proxy)}
            onClick={() => capturePolymarketProfileLinkClick()}
            data-disable-progress
        >
            <div className="flex flex-1 items-center gap-2 text-main">
                <PolymarketIcon className="shrink-0 rounded-full" width={32} height={32} />
                <div className="flex h-9 flex-col">
                    <div className="shrink-0 text-sm font-semibold">
                        {data.platform_name ?? <Trans>Polymarket</Trans>}
                    </div>
                    <div className="ml-auto flex items-center text-[13px] font-medium text-second">
                        {formatAddressEthereum(data.proxy, 4, 2)}
                        <CopyTextButton
                            className="ml-2 text-second"
                            size={14}
                            text={data.proxy}
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
                    {`$${data ? data.balance.toFixed(2) : '-'}`}
                </div>
            </div>
            <div className="flex h-9 flex-1 shrink-0 flex-col items-end justify-between gap-1">
                <div className="text-xs text-second">
                    <Trans>PnL</Trans>
                </div>
                <div className="relative text-success">
                    <span
                        className={`text-sm font-semibold ${
                            !data ? '' : data.pnl < 0 ? 'text-danger' : 'text-success'
                        }`}
                    >
                        {formatPolymarketNumber(data?.pnl, { symbol: true })}
                        <span className="ml-0.5 text-xs font-normal">{toRate(data?.pnl_rate)}</span>
                    </span>
                </div>
            </div>
        </Link>
    );
});
