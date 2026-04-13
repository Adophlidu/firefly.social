import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { PositionCard } from '@/components/Bet/PositionCard.js';
import { ListInPage } from '@/components/ListInPage.js';
import { getPositionsQueryKeys } from '@/helpers/polymarketPositionsCache.js';
import { cn } from '@/lib/utils.js';
import { mapPolymarketV2ToLegacy, type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

const PAGE_SIZE = 20;

export function Positions() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const proxyAddress = account.proxyAddress;
    const proxy = proxyAddress.toLowerCase();
    const positionsQueryKeys = getPositionsQueryKeys(proxyAddress);
    const [showClosed, setShowClosed] = useState(false);

    const activeQueryResult = useSuspenseInfiniteQuery({
        queryKey: positionsQueryKeys.current,
        initialPageParam: 0,
        async queryFn({ pageParam }) {
            const positions = await getFireflyEndpoint().getPolymarketV2CurrentPositions(proxyAddress, {
                offset: pageParam as number,
                limit: PAGE_SIZE,
            });
            return {
                data: (positions ?? []).map((p) => mapPolymarketV2ToLegacy(p, false)),
                nextOffset:
                    (positions?.length ?? 0) >= PAGE_SIZE
                        ? (pageParam as number) + (positions?.length ?? 0)
                        : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        select: (data) => data.pages.flatMap((p) => p.data ?? []),
    });

    const closedQueryResult = useSuspenseInfiniteQuery({
        queryKey: positionsQueryKeys.closed,
        initialPageParam: 0,
        async queryFn({ pageParam }) {
            const positions = await getFireflyEndpoint().getPolymarketV2ClosedPositions(proxyAddress, {
                offset: pageParam as number,
                limit: PAGE_SIZE,
            });
            return {
                data: (positions ?? []).map((p) => mapPolymarketV2ToLegacy(p, true)),
                nextOffset:
                    (positions?.length ?? 0) >= PAGE_SIZE
                        ? (pageParam as number) + (positions?.length ?? 0)
                        : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        select: (data) => data.pages.flatMap((p) => p.data ?? []),
    });

    const activePositions = activeQueryResult.data || EMPTY_LIST;
    const closedPositions = closedQueryResult.data || EMPTY_LIST;
    const hasAnyPositions = activePositions.length > 0 || closedPositions.length > 0;

    return (
        <div className="w-full">
            <ListInPage<PolymarketPosition>
                queryResult={{ ...activeQueryResult, data: activePositions }}
                VirtualListProps={{
                    listKey: `polymarket-positions:${proxy}`,
                    computeItemKey: getPositionKey,
                    itemContent: getItemContent,
                    context: {
                        footerText: <Trans>No more positions</Trans>,
                    },
                }}
                NoResultsFallbackProps={{
                    className: 'px-4',
                    message: hasAnyPositions ? (
                        <Trans>No active positions found in this wallet</Trans>
                    ) : (
                        <Trans>No any positions found in this wallet</Trans>
                    ),
                }}
            />

            {hasAnyPositions ? (
                <div className="w-full px-4 pt-4">
                    <button
                        type="button"
                        className="bg-lightBg mx-auto flex h-9 items-center justify-center gap-2 rounded-[20px] px-6 py-2"
                        onClick={() => setShowClosed((prev) => !prev)}
                    >
                        <span className="text-main text-sm font-semibold">
                            <Trans>View closed positions</Trans>
                        </span>
                        <ArrowLineDownIcon
                            width={14}
                            height={14}
                            className={cn('text-main transition-transform', showClosed && 'rotate-180')}
                        />
                    </button>

                    {showClosed ? (
                        closedPositions.length > 0 ? (
                            <ListInPage<PolymarketPosition>
                                queryResult={{ ...closedQueryResult, data: closedPositions }}
                                VirtualListProps={{
                                    listKey: `polymarket-closed-positions:${proxy}`,
                                    computeItemKey: getPositionKey,
                                    itemContent: getItemContent,
                                    context: {
                                        footerText: <Trans>No more positions</Trans>,
                                    },
                                }}
                            />
                        ) : (
                            <div className="text-secondary flex flex-col items-center py-12">
                                <div className="text-medium mt-3 break-words text-center font-bold">
                                    <Trans>No closed positions found in this wallet</Trans>
                                </div>
                            </div>
                        )
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function getPositionKey(index: number, item: PolymarketPosition) {
    return item.Id || item.tokenId || item.conditionId || String(index);
}

function getItemContent(index: number, item: PolymarketPosition) {
    return (
        <div key={getPositionKey(index, item)} className="px-4 pb-3 pt-4">
            <PositionCard position={item} />
        </div>
    );
}
