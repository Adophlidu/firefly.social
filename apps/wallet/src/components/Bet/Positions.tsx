import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { PositionCard } from '@/components/Bet/PositionCard.js';
import { ListInPage } from '@/components/ListInPage.js';
import { cn } from '@/lib/utils.js';
import { type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

const MIN_SELLABLE_SHARES = 0.01;

function partitionPositions(allPositions: PolymarketPosition[]) {
    const activePositions: PolymarketPosition[] = [];
    const closedPositions: PolymarketPosition[] = [];

    for (const position of allPositions) {
        const isResolved = position.isClaimable || position.is_closed || position.shares < MIN_SELLABLE_SHARES;

        if (isResolved) {
            closedPositions.push(position);
        } else {
            activePositions.push(position);
        }
    }

    const now = Date.now();
    closedPositions.sort((a, b) => {
        if (!a.closed_time && !b.closed_time) return 0;
        return (b.closed_time ?? now) - (a.closed_time ?? now);
    });

    return { activePositions, closedPositions };
}

export function Positions() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const proxyAddress = account.proxyAddress;
    const proxy = proxyAddress.toLowerCase();
    const [showClosed, setShowClosed] = useState(false);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-positions', proxy],
        initialPageParam: 0,
        async queryFn({ pageParam }) {
            return getFireflyEndpoint().getPolymarketPositionsInfo(proxyAddress, {
                cursor: pageParam,
                limit: 20,
                isPolymarketProxy: true,
                isClaim: false,
                excludeWin: false,
            });
        },
        getNextPageParam: (lastPage) => {
            const next = lastPage.cursor;
            const items = lastPage.data ?? EMPTY_LIST;
            if (!next || !items.length) return undefined;
            const n = Number(next);
            return Number.isFinite(n) ? n : undefined;
        },
        select: (data) => {
            return data.pages.flatMap((p) => p.data ?? EMPTY_LIST);
        },
    });

    const allPositions = queryResult.data || EMPTY_LIST;
    const hasAnyPositions = allPositions.length > 0;

    // Keep claimable winning positions in the active list even if backend marks them closed.
    // Only losing positions belong in the collapsed section.
    const { activePositions, closedPositions } = useMemo(() => partitionPositions(allPositions), [allPositions]);

    return (
        <div className="w-full">
            <ListInPage<PolymarketPosition>
                queryResult={{ ...queryResult, data: activePositions }}
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
                            <div className="w-full">
                                {closedPositions.map((position, index) => (
                                    <div key={getPositionKey(index, position)} className="pb-3 pt-4">
                                        <PositionCard position={position} showAction={false} />
                                    </div>
                                ))}
                            </div>
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
    return `${item.Id || item.conditionId}-${index}`;
}

function getItemContent(index: number, item: PolymarketPosition) {
    return (
        <div key={getPositionKey(index, item)} className="px-4 pb-3 pt-4">
            <PositionCard position={item} />
        </div>
    );
}
