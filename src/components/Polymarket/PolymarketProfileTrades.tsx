'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PolymarketTradeItem } from '@/components/Polymarket/PolymarketTradeItem.js';
import { ShowMoreLink } from '@/components/Polymarket/ShowMoreLink.js';
import { ToggleVisibleBox } from '@/components/Polymarket/ToggleVisibleBox.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { fireflyPolymarketProvider } from '@/providers/firefly/Polymarket.js';

interface PolymarketProfileTradesProps {
    address: string;
    proxyAddress?: string;
}
const pageSize = 5;

export function PolymarketProfileTrades({ address }: PolymarketProfileTradesProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['polymarket', 'trades-lite', address],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const data = await fireflyPolymarketProvider.getTradeHistory({ address, limit: pageSize });
            return data.data;
        },
    });

    return (
        <ToggleVisibleBox label={<Trans>Trades</Trans>} contentClassName="!px-0">
            {isLoading ? (
                <div className="flex h-56 items-center justify-center">
                    <LoadingIcon />
                </div>
            ) : data?.length ? (
                <div>
                    <div className="hidden items-center px-4 pb-4 md:flex">
                        <span className="w-[130px] text-[11px] uppercase text-second">
                            <Trans>ACTIVITY</Trans>
                        </span>
                        <span className="flex-1 text-[11px] uppercase text-second">
                            <Trans>MARKET</Trans>
                        </span>
                        <span className="w-[176px] pl-6 text-[11px] uppercase text-second">
                            <Trans>VALUE</Trans>
                        </span>
                    </div>
                    {data.map((trade) => (
                        <PolymarketTradeItem
                            className="odd:bg-lightBg"
                            key={`${trade.eventSlug}-${trade.conditionId}`}
                            trade={trade}
                        />
                    ))}
                    {data.length >= pageSize ? (
                        <ShowMoreLink href={RouteResolver.polymarketProfile(address, 'trades')} />
                    ) : null}
                </div>
            ) : (
                <NoResultsFallback
                    message={
                        <div className="mt-10">
                            <Trans>No trades yet</Trans>
                        </div>
                    }
                />
            )}
        </ToggleVisibleBox>
    );
}
