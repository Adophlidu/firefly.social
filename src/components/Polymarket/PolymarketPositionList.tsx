'use client';

import { Field, Label, Switch } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PolymarketPositionItem } from '@/components/Polymarket/PolymarketPositionItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { PolymarketPositionData } from '@/providers/types/Firefly.js';

interface PolymarketPositionListProps {
    address: string;
    proxyAddress?: string;
}

const getPositionItem = (index: number, positionData: PolymarketPositionData, listKey: string) => {
    return <PolymarketPositionItem positionData={positionData} key={`${positionData.Id}-${index}`} />;
};

export function PolymarketPositionList({ address, proxyAddress }: PolymarketPositionListProps) {
    const [showCurrent, setShowCurrent] = useState(false);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'positions', address, showCurrent],
        staleTime: 0,
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await fireflyEndpointProvider.getPolymarketPositionHistory({
                    address: proxyAddress || address,
                    isProxyAddress: !!proxyAddress,
                    limit: 25,
                    indicator,
                    isClaim: showCurrent,
                });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const loading = !queryResult.isFetchingNextPage && queryResult.isFetching;

    return (
        <div className="p-4">
            <Field className="mb-3 flex items-center gap-1">
                <Switch
                    disabled={loading}
                    checked={showCurrent}
                    onChange={(e) => setShowCurrent(e)}
                    className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-highlight dark:bg-bg data-[checked]:dark:bg-highlight"
                >
                    <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6">
                        {loading ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
                    </span>
                </Switch>
                <Label>
                    <span className="cursor-pointer select-none text-xs font-bold text-main">
                        <Trans>Only show holding</Trans>
                    </span>
                </Label>
            </Field>
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
            {loading ? (
                <Loading />
            ) : (
                <ListInPage
                    source={Source.Polymarket}
                    key={Source.Polymarket}
                    queryResult={queryResult}
                    VirtualListProps={{
                        useWindowScroll: true,
                        listKey: `${ScrollListKey.Polymarket}:positions`,
                        computeItemKey: (index, positionData) => `${positionData.Id}-${index}`,
                        itemContent: (index, positionData) =>
                            getPositionItem(index, positionData, `${ScrollListKey.Polymarket}:positions`),
                    }}
                    NoResultsFallbackProps={{
                        className: 'mt-20',
                        message: <Trans>No positions yet</Trans>,
                    }}
                />
            )}
        </div>
    );
}
