'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PolymarketPositionItem } from '@/components/Polymarket/PolymarketPositionItem.js';
import { ShowMoreLink } from '@/components/Polymarket/ShowMoreLink.js';
import { ToggleVisibleBox } from '@/components/Polymarket/ToggleVisibleBox.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { fireflyPolymarketProvider } from '@/providers/firefly/Polymarket.js';

interface PolymarketProfilePositionProps {
    address: string;
    proxyAddress?: string;
}
const pageSize = 5;

export function PolymarketProfilePosition({ address, proxyAddress }: PolymarketProfilePositionProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['polymarket', 'positions-lite', address],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            return fireflyPolymarketProvider.getPositionHistory({
                address: proxyAddress || address,
                isProxyAddress: !!proxyAddress,
                limit: pageSize,
                isClaim: true,
            });
        },
    });

    return (
        <ToggleVisibleBox disabled={isLoading} label={<Trans>Position</Trans>}>
            {isLoading ? (
                <div className="flex h-56 items-center justify-center">
                    <LoadingIcon />
                </div>
            ) : data?.data.length ? (
                <div>
                    <div className="hidden items-center gap-2 md:flex">
                        <div className="flex-1">
                            <span className="text-[11px] uppercase text-second">
                                <Trans>Market</Trans>
                            </span>
                        </div>
                        <div className="w-16 shrink-0">
                            <span className="text-[11px] uppercase text-second">
                                <Trans>Avg</Trans>
                            </span>
                        </div>
                        <div className="w-16 shrink-0">
                            <span className="text-[11px] uppercase text-second">
                                <Trans>Current</Trans>
                            </span>
                        </div>
                        <div className="w-40 shrink-0 text-right">
                            <span className="text-[11px] uppercase text-second">
                                <Trans>Value</Trans>
                            </span>
                        </div>
                    </div>
                    {data.data.map((positionData) => (
                        <PolymarketPositionItem positionData={positionData} key={positionData.Id} />
                    ))}
                    {data.data.length >= pageSize ? (
                        <ShowMoreLink href={RouteResolver.polymarketProfile(address, 'positions')} />
                    ) : null}
                </div>
            ) : (
                <NoResultsFallback
                    message={
                        <div className="mt-10">
                            <Trans>No positions yet</Trans>
                        </div>
                    }
                />
            )}
        </ToggleVisibleBox>
    );
}
