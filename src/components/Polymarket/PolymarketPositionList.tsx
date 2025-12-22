'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useConnection } from 'wagmi';

import RadioOff from '@/assets/radio.disable-no.svg';
import RadioOn from '@/assets/radio.yes.svg';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PolymarketPositionItem } from '@/components/Polymarket/PolymarketPositionItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useAllProxyWallets } from '@/hooks/bets/useAllProxyWallets.js';
import { getPositionHistory } from '@/providers/firefly/bets/getPositionHistory.js';
import type { PolymarketPositionData } from '@/providers/types/Firefly.js';

interface PolymarketPositionListProps {
    address: string;
    proxyAddress?: string;
}

const getPositionItem = (index: number, positionData: PolymarketPositionData, isMyAddress: boolean) => {
    return (
        <PolymarketPositionItem
            positionData={positionData}
            key={`${positionData.Id}-${index}`}
            showAction={isMyAddress}
        />
    );
};

export function PolymarketPositionList({ address, proxyAddress }: PolymarketPositionListProps) {
    const [onlyHolding, setOnlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(false));
    const { address: myAddress } = useConnection();
    const { data: allProxyWallets = EMPTY_LIST } = useAllProxyWallets();
    const isMyAddress = useMemo(
        () => allProxyWallets.some((x) => isSameEthereumAddress(x, myAddress)),
        [allProxyWallets, myAddress],
    );

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'positions', address.toLowerCase(), onlyHolding],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getPositionHistory({
                    address: proxyAddress || address,
                    isProxyAddress: !!proxyAddress,
                    limit: 10,
                    indicator,
                    isClaim: onlyHolding,
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
            <label
                role="button"
                className="mb-3 flex cursor-pointer items-center gap-1"
                onClick={() => setOnlyHolding((prev) => !prev)}
            >
                {onlyHolding ? (
                    <RadioOn className="size-4 text-highlight" />
                ) : (
                    <RadioOff className="size-4 text-secondaryLine" />
                )}
                <span className="cursor-pointer select-none text-xs font-bold text-second">
                    <Trans>Only show holding</Trans>
                </span>
            </label>
            {loading ? (
                <Loading />
            ) : (
                <ListInPage
                    source={Source.Bets}
                    key={Source.Bets}
                    queryResult={queryResult}
                    VirtualListProps={{
                        useWindowScroll: true,
                        listKey: `${ScrollListKey.Bets}:positions`,
                        computeItemKey: (index, positionData) => `${positionData.Id}-${index}`,
                        itemContent: (index, positionData) => getPositionItem(index, positionData, isMyAddress),
                    }}
                    NoResultsFallbackProps={{
                        className: 'mt-20',
                        message: <Trans>No positions found in this wallet</Trans>,
                    }}
                />
            )}
        </div>
    );
}
