import BetHistoryEmptyIcon from '@dimensiondev/assets/bet-history-empty.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useQuery, useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';

import { BetEmptyState } from '@/components/Bet/BetEmptyState.js';
import { PositionCard } from '@/components/Bet/PositionCard.js';
import { ListInPage } from '@/components/ListInPage.js';
import {
    filterSoldPositions,
    getPositionsQueryKeys,
    getSoldPositionsQueryKey,
    type SoldPositionMatcher,
} from '@/helpers/polymarketPositionsCache.js';
import { mapPolymarketV2ToLegacy, type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

const PAGE_SIZE = 20;

export function Positions() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const proxyAddress = account.proxyAddress;
    const proxy = proxyAddress.toLowerCase();
    const positionsQueryKeys = getPositionsQueryKeys(proxyAddress);
    const { data: soldPositions = EMPTY_LIST } = useQuery<SoldPositionMatcher[]>({
        queryKey: getSoldPositionsQueryKey(proxyAddress),
        queryFn: () => [],
        staleTime: Number.POSITIVE_INFINITY,
    });

    const activeQueryResult = useSuspenseInfiniteQuery({
        queryKey: positionsQueryKeys.current,
        initialPageParam: 0,
        async queryFn({ pageParam }) {
            const positions = await getFireflyEndpoint().getPolymarketV2CurrentPositions(proxyAddress, {
                offset: pageParam as number,
                limit: PAGE_SIZE,
                sortBy: 'CURRENT',
                sortDirection: 'DESC',
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
        select: (data) => data.pages.flatMap((p) => p.data || []).filter((x) => x.shares > 0),
    });

    const activePositions = filterSoldPositions(activeQueryResult.data || EMPTY_LIST, soldPositions);

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
                    icon: <BetHistoryEmptyIcon className="text-third h-[128px] w-[160px]" />,
                    message: <BetEmptyState message={<Trans>No positions found</Trans>} />,
                }}
            />
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
