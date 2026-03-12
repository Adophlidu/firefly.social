'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, type ReactNode, useEffect, useMemo, useState } from 'react';

import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import { ListInPage } from '@/components/ListInPage.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
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
        <div key={`${positionData.Id}-${index}`} className="pb-4">
            <PredictionPositionItem
                key={positionData.Id}
                platform={platform}
                positionData={positionData}
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
        </div>
    );
};

export function partitionPredictionPositions(allPositions: PredictionPositionDataForUI[]) {
    const activePositions: PredictionPositionDataForUI[] = [];
    const closedPositions: PredictionPositionDataForUI[] = [];

    for (const position of allPositions) {
        const isUnclaimedWin = position.isClaimable && position.isWin;
        const isClosedLoss = (position.isClaimable && !position.isWin) || (position.is_closed && position.pnl < 0);

        if (isClosedLoss) {
            closedPositions.push(position);
            continue;
        }

        if (isUnclaimedWin || !position.is_closed) {
            activePositions.push(position);
        }
    }

    return { activePositions, closedPositions };
}

function PositionEmptyState({ message }: { message: ReactNode }) {
    return (
        <div className="flex h-40 items-center justify-center rounded-xl bg-primaryBottom p-4">
            <div className="max-w-[303px] text-center text-base font-semibold text-second">{message}</div>
        </div>
    );
}

export const PredictionProfilePositionList = memo<Props>(function PredictionProfilePositionList({
    predictionProfile,
    platform,
    address,
    proxyAddress,
}) {
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
    }, [platform, address, queryClient, subscribeToWalletEvents]);
    const { data: socialProfile } = useProxyWalletInfo(platform, proxyAddress);
    const fireflyAccountId = socialProfile?.fireflyAccountId;

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'positions', address.toLowerCase()],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getPredictionPositionList(platform, {
                    address: proxyAddress || address,
                    isProxyAddress: !!proxyAddress,
                    indicator,
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
    const hasAnyPositions = allPositions.length > 0;

    // Keep claimable winning positions in the main list even if backend marks them closed.
    // Only losing positions belong in the collapsed section.
    const { activePositions, closedPositions } = useMemo(
        () => partitionPredictionPositions(allPositions),
        [allPositions],
    );

    return (
        <div className="p-4">
            <div className="space-y-4">
                {activePositions.length ? (
                    <ListInPage
                        source={Source.Prediction}
                        key={Source.Prediction}
                        queryResult={{ ...queryResult, data: activePositions }}
                        noResultsFallbackRequired={false}
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
                            context: {
                                isScrollable: false,
                            },
                        }}
                    />
                ) : (
                    <PositionEmptyState
                        message={
                            hasAnyPositions ? (
                                <Trans>No active positions found in this wallet</Trans>
                            ) : (
                                <Trans>No any positions found in this wallet</Trans>
                            )
                        }
                    />
                )}

                {hasAnyPositions ? (
                    <div className="space-y-4">
                        <button
                            type="button"
                            className="mx-auto flex h-9 items-center justify-center gap-2 rounded-[20px] bg-lightBg px-6 py-2"
                            onClick={() => setShowClosed((prev) => !prev)}
                        >
                            <span className="text-sm font-semibold text-main">
                                <Trans>View closed positions</Trans>
                            </span>
                            <ArrowLineDownIcon
                                width={14}
                                height={14}
                                className={classNames(
                                    'text-main transition-transform',
                                    showClosed ? 'rotate-180' : null,
                                )}
                            />
                        </button>

                        {showClosed ? (
                            closedPositions.length ? (
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
                            ) : (
                                <PositionEmptyState message={<Trans>No closed positions found in this wallet</Trans>} />
                            )
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
});
