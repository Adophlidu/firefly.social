'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { memo, useMemo } from 'react';
import { useConnection } from 'wagmi';

import { BetsPositionFilter } from '@/components/Bets/BetsPositionFilter.js';
import { BetsPositionItem } from '@/components/Bets/BetsPositionItem.js';
import { getBetsPositionList } from '@/components/Bets/getBetsPositionList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { BetsPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useAllProxyWallets } from '@/hooks/bets/useAllProxyWallets.js';
import { type BetsPositionDataForUI } from '@/types/bets.js';

interface Props {
    platform: BetsPlatform;
    address: string;
    proxyAddress?: string;
}
interface Options {
    platform: BetsPlatform;
    index: number;
    positionData: BetsPositionDataForUI;
    isMyAddress: boolean;
}

const getPositionItem = ({ platform, index, positionData, isMyAddress }: Options) => {
    return (
        <BetsPositionItem
            platform={platform}
            positionData={positionData}
            key={`${positionData.Id}-${index}`}
            showAction={isMyAddress}
        />
    );
};

export const BetsProfilePositionList = memo<Props>(function BetsProfilePositionList({
    platform,
    address,
    proxyAddress,
}) {
    const [onlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(false));
    const { address: myAddress } = useConnection();
    const { data: allProxyWallets = EMPTY_LIST } = useAllProxyWallets();
    const isMyAddress = useMemo(
        () => allProxyWallets.some((x) => isSameEthereumAddress(x, myAddress)),
        [allProxyWallets, myAddress],
    );

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'positions', address.toLowerCase(), onlyHolding],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getBetsPositionList(platform, {
                    address: proxyAddress || address,
                    isProxyAddress: !!proxyAddress,
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

    return (
        <div className="p-4">
            {platform === BetsPlatform.Polymarket ? <BetsPositionFilter /> : null}
            <ListInPage
                source={Source.Bets}
                key={Source.Bets}
                queryResult={queryResult}
                VirtualListProps={{
                    useWindowScroll: true,
                    listKey: `${ScrollListKey.Bets}:positions`,
                    computeItemKey: (index, positionData) => `${positionData.Id}-${index}`,
                    itemContent: (index, positionData) =>
                        getPositionItem({ index, positionData, isMyAddress, platform }),
                }}
                NoResultsFallbackProps={{
                    className: 'mt-20',
                    message: <Trans>No positions found in this wallet</Trans>,
                }}
            />
        </div>
    );
});
