'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, type ReactNode, useEffect, useMemo, useState } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import { PredictionPositionItem } from '@/components/Prediction/PredictionPositionItem.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { useAllProxyWallets } from '@/hooks/prediction/useAllProxyWallets.js';
import { useProxyWalletInfo } from '@/hooks/prediction/useProxyWalletInfo.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { PredictionPositionDataForUI, PredictionProfileDataForUI } from '@/types/prediction.js';

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
    showAction: boolean;
}

const getPositionItem = ({
    platform,
    index,
    positionData,
    showAction,
    predictionProfile,
    fireflyAccountId,
}: Options) => {
    return (
        <div key={`${positionData.Id}-${index}`} className="pb-4">
            <PredictionPositionItem
                key={positionData.Id}
                platform={platform}
                positionData={positionData}
                showAction={showAction}
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

const MIN_SELLABLE_SHARES = 0.01;

export function partitionPredictionPositions(allPositions: PredictionPositionDataForUI[]) {
    const activePositions: PredictionPositionDataForUI[] = [];
    const closedPositions: PredictionPositionDataForUI[] = [];

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

function PositionEmptyState({ message }: { message: ReactNode }) {
    return (
        <div className="bg-primaryBottom flex h-40 items-center justify-center rounded-xl p-4">
            <div className="text-second max-w-[303px] text-center text-base font-semibold">{message}</div>
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
                                    showAction: isMyAddress,
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
                            className="bg-lightBg mx-auto flex h-9 items-center justify-center gap-2 rounded-[20px] px-6 py-2"
                            onClick={() => setShowClosed((prev) => !prev)}
                        >
                            <span className="text-main text-sm font-semibold">
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
                                            showAction: false,
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
