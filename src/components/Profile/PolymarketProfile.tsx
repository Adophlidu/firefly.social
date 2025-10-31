'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import PolymarketIcon from '@/assets/polymarket.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketMarketsTraded } from '@/components/Polymarket/PolymarketMarketsTraded.js';
import { Link } from '@/esm/Link.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { capturePolymarketProfileLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface PolymarketProfileProps {
    address: string;
}

export const PolymarketProfile = memo<PolymarketProfileProps>(function PolymarketProfile({ address }) {
    const { isLoading, data } = useQuery({
        queryKey: ['polymarket', 'profile', address],
        staleTime: 1000 * 60 * 5,
        queryFn: () => FireflyEndpointProvider.getPolymarketProfile(address),
    });

    return (
        <Link
            className="rounded-xl p-4"
            href={RouteResolver.polymarketProfile(address)}
            style={{
                backgroundColor: '#DADADA33',
            }}
            onClick={() => capturePolymarketProfileLinkClick()}
        >
            <div className="flex items-center gap-2 text-main">
                <PolymarketIcon className="shrink-0" width={20} height={20} />
                <span className="shrink-0 text-sm font-semibold">
                    <Trans>Polymarket</Trans>
                </span>
                {isLoading ? <LoadingIcon size={18} /> : null}
                <span className="ml-auto text-[13px] font-medium">{formatAddressEthereum(address, 4, 2)}</span>
            </div>
            <div className="mt-4 block md:flex md:flex-wrap md:items-center">
                <div className="flex shrink-0 items-center md:flex-1">
                    <div className="flex flex-1 shrink-0 flex-col gap-1">
                        <span className="text-xs text-second">
                            <Trans>Portfolio</Trans>
                        </span>
                        <span className="relative text-sm font-semibold text-main">
                            {`$${data ? data.balance.toFixed(2) : '-'}`}
                        </span>
                    </div>
                    <div className="flex flex-1 shrink-0 flex-col gap-1">
                        <span className="text-xs text-second">
                            <Trans>PnL</Trans>
                        </span>
                        <div className="relative text-success">
                            <span
                                className={classNames(
                                    'text-sm font-semibold',
                                    !data ? '' : data.pnl < 0 ? 'text-danger' : 'text-success',
                                )}
                            >
                                {formatPolymarketNumber(data?.pnl, { symbol: true })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex shrink-0 items-center md:mt-0 md:flex-1">
                    <div className="flex flex-1 shrink-0 flex-col gap-1">
                        <span className="text-xs text-second">
                            <Trans>Win Rate</Trans>
                        </span>
                        <span className="relative text-sm font-semibold text-main">
                            {data ? `${(data.win_rate * 100).toFixed(2)}%` : '-'}
                        </span>
                    </div>
                    <PolymarketMarketsTraded
                        className="flex-1 shrink-0"
                        address={address}
                        proxyAddress={data?.proxy}
                        enabled={!isLoading}
                    />
                </div>
            </div>
        </Link>
    );
});
