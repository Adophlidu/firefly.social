import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, XStack, YStack } from 'tamagui';

import { PerpsTradeDetailHeader } from '@/components/PerpsTradeDetailHeader';
import { PerpsTradeDetailPositionsSection } from '@/components/PerpsTradeDetailPositionsSection';
import { PerpsTradeForm } from '@/components/PerpsTradeForm';
import { PerpsTradeOrderBookPanel } from '@/components/PerpsTradeOrderBookPanel';
import { loadPerpsTradeDetailPage } from '@/services/perpsTradeDetail';
import { PerpsTradeDetailSkeleton } from '@/skeletons/PerpsTradeDetailSkeleton';
import type {
    FetchAddToPositionSheet,
    FetchLeverageSheet,
    FetchMarginModeSheet,
    FetchOrderTypeSheet,
    FetchPerpsTradeDetailPage,
    FetchTpSlSheet,
    SubmitAddToPosition,
    SubmitLeverageChange,
    SubmitMarginModeChange,
    SubmitOrderTypeChange,
    SubmitTpSl,
} from '@/types/services';
import type { AccountAmountActionType, PerpsTradeDetailPageData } from '@/types/ui';

export interface PerpsTradeDetailProps {
    market?: string;
    fetchPerpsTradeDetailPage?: FetchPerpsTradeDetailPage;
    fetchAddToPositionSheet?: FetchAddToPositionSheet;
    submitAddPosition?: SubmitAddToPosition;
    fetchLeverageSheet?: FetchLeverageSheet;
    submitLeverage?: SubmitLeverageChange;
    fetchMarginModeSheet?: FetchMarginModeSheet;
    submitMarginMode?: SubmitMarginModeChange;
    fetchOrderTypeSheet?: FetchOrderTypeSheet;
    submitOrderType?: SubmitOrderTypeChange;
    fetchTpSlSheet?: FetchTpSlSheet;
    submitTpSlValue?: SubmitTpSl;
    onBack?: () => void;
    onGoDetail?: (market: string) => void;
    onGoHistory?: () => void;
    onAccountAmountAction?: (actionType: AccountAmountActionType) => void;
}

export const PerpsTradeDetail = memo<PerpsTradeDetailProps>(function PerpsTradeDetail({
    market = 'BTCUSDC',
    fetchPerpsTradeDetailPage,
    fetchAddToPositionSheet,
    submitAddPosition,
    fetchLeverageSheet,
    submitLeverage,
    fetchMarginModeSheet,
    submitMarginMode,
    fetchOrderTypeSheet,
    submitOrderType,
    fetchTpSlSheet,
    submitTpSlValue,
    onBack,
    onGoDetail,
    onGoHistory,
    onAccountAmountAction,
}) {
    const [loading, setLoading] = useState(true);
    const [pageData, setPageData] = useState<PerpsTradeDetailPageData | null>(null);

    const loadData = useMemo(() => {
        return fetchPerpsTradeDetailPage ?? loadPerpsTradeDetailPage;
    }, [fetchPerpsTradeDetailPage]);

    const handleTradeFormChange = useCallback(
        (patch: Partial<Pick<PerpsTradeDetailPageData['tradeForm'], 'marginMode' | 'leverage' | 'orderType'>>) => {
            setPageData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tradeForm: {
                        ...prev.tradeForm,
                        ...patch,
                    },
                };
            });
        },
        [],
    );

    const handleGoDetail = useCallback(() => {
        if (pageData) {
            onGoDetail?.(pageData.ticker.symbol);
        }
    }, [onGoDetail, pageData]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);

            try {
                const response = await loadData({ market });
                if (!cancelled) {
                    setPageData(response.data);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [loadData, market]);

    if (loading || !pageData) {
        return <PerpsTradeDetailSkeleton />;
    }

    return (
        <YStack height="100%" minHeight={0} backgroundColor="#FFFFFF">
            <PerpsTradeDetailHeader
                available={pageData.tradeForm.available}
                ticker={pageData.ticker}
                onBack={onBack}
                onSettingsPress={handleGoDetail}
                onAccountAmountAction={onAccountAmountAction}
            />

            <ScrollView flex={1} minHeight={0} showsVerticalScrollIndicator={false}>
                <YStack gap={12}>
                    {/* Order Book + Trade Form */}
                    <XStack paddingHorizontal={12} gap={8} alignItems="flex-start" justifyContent="center">
                        <XStack flex={3} flexBasis="0%">
                            <PerpsTradeOrderBookPanel
                                orderBook={pageData.orderBook}
                                fundingRate={pageData.ticker.fundingRate}
                                countdown={pageData.ticker.countdown}
                            />
                        </XStack>
                        <XStack flex={4} flexBasis="0%">
                            <PerpsTradeForm
                                market={market}
                                tradeForm={pageData.tradeForm}
                                fetchLeverageSheet={fetchLeverageSheet}
                                submitLeverage={submitLeverage}
                                fetchMarginModeSheet={fetchMarginModeSheet}
                                submitMarginMode={submitMarginMode}
                                fetchOrderTypeSheet={fetchOrderTypeSheet}
                                submitOrderType={submitOrderType}
                                onTradeFormChange={handleTradeFormChange}
                            />
                        </XStack>
                    </XStack>

                    <PerpsTradeDetailPositionsSection
                        market={market}
                        positions={pageData.positions}
                        openOrders={pageData.openOrders}
                        openOrdersCount={pageData.openOrdersCount}
                        lastPrice={pageData.orderBook.lastPrice}
                        available={pageData.tradeForm.available}
                        fetchAddToPositionSheet={fetchAddToPositionSheet}
                        submitAddPosition={submitAddPosition}
                        fetchTpSlSheet={fetchTpSlSheet}
                        submitTpSlValue={submitTpSlValue}
                        onHistoryPress={onGoHistory}
                    />
                </YStack>
            </ScrollView>
        </YStack>
    );
});
