'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { memo, useEffect, useMemo, useState } from 'react';

import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import { ListInPage } from '@/components/ListInPage.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import { PredictionPositionFilter } from '@/components/Prediction/PredictionPositionFilter.js';
import { PredictionPositionItem } from '@/components/Prediction/PredictionPositionItem.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useAllProxyWallets } from '@/hooks/prediction/useAllProxyWallets.js';
import { useProxyWalletInfo } from '@/hooks/prediction/useProxyWalletInfo.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { type PredictionPositionDataForUI, type PredictionProfileDataForUI } from '@/types/prediction.js';

interface Props {
    predictionProfile: PredictionProfileDataForUI;
    platform: PredictionPlatform;
    address: string;
    proxyAddress: string;
}
interface Options {
    predictionProfile: PredictionProfileDataForUI;
    fireflyAccountId?: string;
    platform: PredictionPlatform;
    index: number;
    positionData: PredictionPositionDataForUI;
    isMyAddress: boolean;
}

const getPositionItem = ({
    platform,
    index,
    positionData,
    isMyAddress,
    predictionProfile,
    fireflyAccountId,
}: Options) => {
    return (
        <PredictionPositionItem
            platform={platform}
            positionData={positionData}
            key={`${positionData.Id}-${index}`}
            showAction={isMyAddress}
            targetProfileInfo={{
                address: predictionProfile.wallet,
                proxyAddress: predictionProfile.proxy,
                polymarketName: predictionProfile.platform_name,
                opinionName: predictionProfile.platform_name,
                isFireflyUser: !!fireflyAccountId,
                fireflyAccountId,
            }}
        />
    );
};

export const PredictionProfilePositionList = memo<Props>(function PredictionProfilePositionList({
    predictionProfile,
    platform,
    address,
    proxyAddress,
}) {
    const [onlyHolding] = useQueryState('holding', parseAsBoolean.withDefault(true));
    const { data: allProxyWallets = EMPTY_LIST } = useAllProxyWallets();
    const isMyAddress = useMemo(
        () => allProxyWallets.some((x) => isSameEthereumAddress(x, address)),
        [address, allProxyWallets],
    );
    const queryClient = useQueryClient();
    const subscribeToWalletEvents = useGlobalState((state) => state.subscribeToWalletEvents);
    const [showClosed, setShowClosed] = useState(false);

    useEffect(() => {
        if (platform !== PredictionPlatform.Polymarket) return;

        const unsubscribe = subscribeToWalletEvents('position-operation', () => {
            queryClient.refetchQueries({
                queryKey: ['bets', 'positions', address.toLowerCase()],
            });
        });

        return unsubscribe;
    }, [platform, address, onlyHolding, queryClient, subscribeToWalletEvents]);
    const { data: socialProfile } = useProxyWalletInfo(platform, proxyAddress);
    const fireflyAccountId = socialProfile?.fireflyAccountId;

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

    const allPositions = queryResult.data || EMPTY_LIST;

    // Keep claimable winning positions in the main list even if backend marks them closed.
    // Only settled losses and fully closed positions go into the collapsed section.
    const { activePositions, closedPositions } = useMemo(() => {
        const active: PredictionPositionDataForUI[] = [];
        const closed: PredictionPositionDataForUI[] = [];

        for (const position of allPositions) {
            const isUnclaimedWin = position.isClaimable && position.isWin;
            const isClosedLoss = position.isClaimable && !position.isWin;
            if ((position.is_closed && !isUnclaimedWin) || isClosedLoss) {
                closed.push(position);
            } else {
                active.push(position);
            }
        }

        return { activePositions: active, closedPositions: closed };
    }, [allPositions]);

    return (
        <div className="p-4">
            {platform === PredictionPlatform.Polymarket ? <PredictionPositionFilter /> : null}
            <ListInPage
                source={Source.Prediction}
                key={Source.Prediction}
                queryResult={{ ...queryResult, data: activePositions }}
                VirtualListProps={{
                    useWindowScroll: true,
                    listKey: `${ScrollListKey.Prediction}:positions`,
                    computeItemKey: (index, positionData) => `${positionData.Id}-${index}`,
                    itemContent: (index, positionData) =>
                        getPositionItem({
                            index,
                            positionData,
                            isMyAddress,
                            platform,
                            predictionProfile,
                            fireflyAccountId,
                        }),
                }}
                NoResultsFallbackProps={{
                    icon: <div />,
                    message: onlyHolding ? (
                        <Trans>No current positions found in this wallet</Trans>
                    ) : (
                        <Trans>No any positions found in this wallet</Trans>
                    ),
                }}
            />

            {closedPositions.length ? (
                <div className="pt-4">
                    <button
                        type="button"
                        className="mx-auto my-4 flex h-9 items-center justify-center gap-2 rounded-[20px] bg-lightBg px-6 py-2"
                        onClick={() => setShowClosed((prev) => !prev)}
                    >
                        <span className="text-sm font-semibold text-main">
                            <Trans>View closed positions</Trans>
                        </span>
                        <ArrowLineDownIcon
                            width={14}
                            height={14}
                            className={classNames('text-main transition-transform', showClosed ? 'rotate-180' : null)}
                        />
                    </button>

                    {showClosed ? (
                        <div className="w-full">
                            {closedPositions.map((positionData, index) =>
                                getPositionItem({
                                    index,
                                    positionData,
                                    isMyAddress,
                                    platform,
                                    predictionProfile,
                                    fireflyAccountId,
                                }),
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
});
