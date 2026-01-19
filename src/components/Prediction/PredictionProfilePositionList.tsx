'use client';

import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { memo, useEffect, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import { PredictionPositionFilter } from '@/components/Prediction/PredictionPositionFilter.js';
import { PredictionPositionItem } from '@/components/Prediction/PredictionPositionItem.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useAllProxyWallets } from '@/hooks/prediction/useAllProxyWallets.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { type PredictionPositionDataForUI } from '@/types/prediction.js';

interface Props {
    platform: PredictionPlatform;
    address: string;
    proxyAddress?: string;
}
interface Options {
    platform: PredictionPlatform;
    index: number;
    positionData: PredictionPositionDataForUI;
    isMyAddress: boolean;
}

const getPositionItem = ({ platform, index, positionData, isMyAddress }: Options) => {
    return (
        <PredictionPositionItem
            platform={platform}
            positionData={positionData}
            key={`${positionData.Id}-${index}`}
            showAction={isMyAddress}
        />
    );
};

export const PredictionProfilePositionList = memo<Props>(function PredictionProfilePositionList({
    platform,
    address,
    proxyAddress,
}) {
    const [onlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(false));
    const { data: allProxyWallets = EMPTY_LIST } = useAllProxyWallets();
    const isMyAddress = useMemo(
        () => allProxyWallets.some((x) => isSameEthereumAddress(x, address)),
        [address, allProxyWallets],
    );
    const queryClient = useQueryClient();
    const subscribeToWalletEvents = useGlobalState((state) => state.subscribeToWalletEvents);

    useEffect(() => {
        if (platform !== PredictionPlatform.Polymarket) return;

        const unsubscribe = subscribeToWalletEvents('position-operation', () => {
            queryClient.refetchQueries({
                queryKey: ['bets', 'positions', address.toLowerCase()],
            });
        });

        return unsubscribe;
    }, [platform, address, onlyHolding, queryClient, subscribeToWalletEvents]);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'positions', address.toLowerCase(), onlyHolding],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getPredictionPositionList(platform, {
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
            {platform === PredictionPlatform.Polymarket ? <PredictionPositionFilter /> : null}
            <ListInPage
                source={Source.Prediction}
                key={Source.Prediction}
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
