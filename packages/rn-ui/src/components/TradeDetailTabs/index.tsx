import { useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useAtomValue } from 'jotai';
import { memo, useCallback, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { AddToPositionSheet } from '@/components/AddToPositionSheet';
import { ButtonUI } from '@/components/ButtonUI';
import { ClosePositionSheet } from '@/components/ClosePositionSheet';
import { type PerpsTradeDetailTab, PerpsTradeDetailTabs } from '@/components/PerpsTradeDetailTabs';
import { CloseAllConfirmSheet } from '@/components/Sheets/CloseAllConfirmSheet';
import { TpSlSheet } from '@/components/TpSlSheet';
import { ActivePositions } from '@/components/TradeDetailTabs/ActivePositions';
import { OpenOrders } from '@/components/TradeDetailTabs/OpenOrders';
import { formatAmount } from '@/helpers/formatAmount';
import { formatCoinName } from '@/helpers/formatCoinName';
import { isGreaterThan } from '@/helpers/number';
import { findFullPositionTpslOrders } from '@/helpers/perpsPositionTpsl';
import { toast } from '@/helpers/toast';
import { useActivePositions } from '@/hooks/Perps/useActivePositions';
import { type PerpOrderCancelId, runCancelPerpOpenOrders } from '@/hooks/Perps/useCancelOrders';
import { useCancelPerpOrder } from '@/hooks/Perps/useCancelPerpOrder';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { useMarketCloseAllPositions } from '@/hooks/Perps/useMarketCloseAllPositions';
import { useOpenOrders } from '@/hooks/Perps/useOpenOrders';
import { useSetPositionTpsl } from '@/hooks/Perps/useSetPositionTpsl';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { submitAddToPosition } from '@/services/addToPosition';
import { coinNameAtom } from '@/store/tradeForm';
import { exchangeClientAtom } from '@/store/wallet';
import type { SubmitAddToPosition, SubmitTpSl } from '@/types/services';
import type {
    AddToPositionSheetData,
    ClosePositionSheetData,
    PerpsPositionItem,
    Position,
    TpSlSheetData,
} from '@/types/ui';

type CloseAllIntent = { kind: 'positions'; positions: Position[] } | { kind: 'orders'; orderIds: PerpOrderCancelId[] };

interface TradeDetailTabsProps {
    market: string;
    submitAddPosition?: SubmitAddToPosition;
    submitTpSlValue?: SubmitTpSl;
}

const defaultAddToPositionData: AddToPositionSheetData = {
    symbol: 'BTC',
    currentPrice: '$70,401',
    defaultAmount: '10.19',
    minimumAmount: 5.05,
    liquidationPrice: '$92,356',
    newTotal: '$110.21',
};

function CheckboxCheckedIcon() {
    const theme = useTheme();
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M1.33 4.93C1.33 2.73 2.73 1.33 4.93 1.33H11.06C13.27 1.33 14.67 2.73 14.67 4.93V11.07C14.67 13.27 13.27 14.67 11.07 14.67H4.93C2.73 14.67 1.33 13.27 1.33 11.07V4.93Z"
                fill={theme.text!.get()}
            />
            <Path
                d="M5.16 8L7.15 9.99L10.84 6.01"
                stroke={theme.bg!.get()}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export const TradeDetailTabs = memo<TradeDetailTabsProps>(function TradeDetailTabs({
    market,
    submitAddPosition,
    submitTpSlValue,
}) {
    const [activeTab, setActiveTab] = useState<PerpsTradeDetailTab>('positions');
    const [closeSheetOpen, setCloseSheetOpen] = useState(false);
    const [closeSheetData] = useState<ClosePositionSheetData | null>(null);
    const [addSheetOpen, setAddSheetOpen] = useState(false);
    const [addSheetLoading] = useState(false);
    const [addSheetData] = useState<AddToPositionSheetData>(defaultAddToPositionData);
    const [activePosition] = useState<PerpsPositionItem | null>(null);
    const [tpSlSheetOpen, setTpSlSheetOpen] = useState(false);
    const [tpSlPosition, setTpSlPosition] = useState<Position | null>(null);
    const [closeAllConfirmOpen, setCloseAllConfirmOpen] = useState(false);
    const [closeAllIntent, setCloseAllIntent] = useState<CloseAllIntent | null>(null);
    const [showCurrent, setShowCurrent] = useState(false);

    const coinName = useAtomValue(coinNameAtom);
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const queryClient = useQueryClient();

    const openOrders = useOpenOrders();
    const positions = useActivePositions();

    const filteredOrders = useMemo(() => {
        if (!showCurrent) return openOrders;

        return openOrders.filter((order) => order.coin === coinName);
    }, [openOrders, coinName, showCurrent]);
    const filteredPositions = useMemo(() => {
        if (!showCurrent) return positions;

        return positions.filter((position) => position.coin === coinName);
    }, [positions, coinName, showCurrent]);

    const submitAdd = useMemo(() => {
        return submitAddPosition ?? submitAddToPosition;
    }, [submitAddPosition]);

    const { data: tpSlCoinInfo } = useCoinInfo(tpSlPosition?.coin);

    const tpSlOrders = useMemo(
        () =>
            tpSlPosition ? findFullPositionTpslOrders(openOrders, tpSlPosition.coin) : { tpOrder: null, slOrder: null },
        [openOrders, tpSlPosition],
    );

    const tpSlSheetData = useMemo((): TpSlSheetData | null => {
        if (!tpSlPosition) return null;
        const mark = tpSlCoinInfo?.assetCtx?.markPx || '0';
        const liq = tpSlPosition.liquidationPx ? formatAmount(tpSlPosition.liquidationPx, 4) : '--';
        const isLong = isGreaterThan(tpSlPosition.szi, '0');
        const levRaw = Number(tpSlPosition.leverage.value);
        const leverage = Number.isFinite(levRaw) && levRaw > 0 ? levRaw : 1;
        const szDecimals = tpSlCoinInfo?.szDecimals ?? 0;
        const absSzi = new BigNumber(tpSlPosition.szi).abs();
        const positionSizeAbs = absSzi.isFinite() && absSzi.gt(0) ? absSzi.toFixed(szDecimals) : '0';
        return {
            symbol: formatCoinName(tpSlPosition.coin),
            entryPrice: tpSlPosition.entryPx,
            markPrice: mark === '0' ? '--' : mark,
            estimatedLiqPrice: liq,
            tpPrice: '',
            tpType: 'percent',
            slPrice: '',
            slType: 'percent',
            side: isLong ? 'long' : 'short',
            leverage,
            szDecimals,
            positionSizeAbs,
        };
    }, [tpSlPosition, tpSlCoinInfo]);

    const [{ loading: submitTpSlLoading }, submitPositionTpSl] = useSetPositionTpsl({
        position: tpSlPosition ?? undefined,
        coinInfo: tpSlCoinInfo ?? undefined,
        markPx: tpSlCoinInfo?.assetCtx?.markPx,
        hasExistingTp: Boolean(tpSlOrders.tpOrder),
        hasExistingSl: Boolean(tpSlOrders.slOrder),
    });

    const [{ loading: cancelPerpLoading }, cancelPerpOrder] = useCancelPerpOrder();

    const handleCloseAll = useCallback(() => {
        if (activeTab === 'positions') {
            if (!filteredPositions.length) return;
            setCloseAllIntent({ kind: 'positions', positions: [...filteredPositions] });
        } else {
            if (!filteredOrders.length) return;
            setCloseAllIntent({
                kind: 'orders',
                orderIds: filteredOrders.map((o) => ({ oid: o.oid, coin: o.coin })),
            });
        }
        setCloseAllConfirmOpen(true);
    }, [activeTab, filteredOrders, filteredPositions]);

    const handleCloseAllConfirmOpenChange = useCallback((open: boolean) => {
        setCloseAllConfirmOpen(open);
        if (!open) {
            setCloseAllIntent(null);
        }
    }, []);

    const handleConfirmAdd = useCallback(
        async (amount: number) => {
            if (!activePosition) return;
            await submitAdd({ market, positionId: activePosition.id, amount });
        },
        [activePosition, market, submitAdd],
    );

    const handleConfirmTpSl = useCallback(
        async ({
            tpPrice,
            slPrice,
            tpType,
            slType,
        }: {
            tpPrice: string;
            slPrice: string;
            tpType: 'percent';
            slType: 'percent';
        }): Promise<boolean> => {
            if (!tpSlPosition) return false;
            if (submitTpSlValue) {
                const result = await submitTpSlValue({
                    market,
                    positionId: tpSlPosition.coin,
                    coin: tpSlPosition.coin,
                    tpPrice,
                    slPrice,
                    tpType,
                    slType,
                });
                return result.success;
            }
            return submitPositionTpSl({ tpPrice, slPrice });
        },
        [tpSlPosition, market, submitTpSlValue, submitPositionTpSl],
    );

    const handleOpenTpSl = useCallback((position: Position) => {
        setTpSlPosition(position);
        setTpSlSheetOpen(true);
    }, []);

    const handleTpSlSheetOpenChange = useCallback((open: boolean) => {
        setTpSlSheetOpen(open);
        if (!open) {
            setTpSlPosition(null);
        }
    }, []);

    const handleCancelTpOrder = useCallback(async () => {
        const o = tpSlOrders.tpOrder;
        if (!o || !tpSlPosition) return;
        await cancelPerpOrder({ coin: tpSlPosition.coin, oid: o.oid });
    }, [tpSlOrders.tpOrder, tpSlPosition, cancelPerpOrder]);

    const handleCancelSlOrder = useCallback(async () => {
        const o = tpSlOrders.slOrder;
        if (!o || !tpSlPosition) return;
        await cancelPerpOrder({ coin: tpSlPosition.coin, oid: o.oid });
    }, [tpSlOrders.slOrder, tpSlPosition, cancelPerpOrder]);

    const [, marketCloseAll] = useMarketCloseAllPositions();

    const [{ loading: isCloseAllLoading }, executeCloseAll] = useAsyncFn(
        async (intent: CloseAllIntent) => {
            if (intent.kind === 'orders') {
                try {
                    if (!exchangeClient) {
                        throw new Error('Exchange client not initialized');
                    }
                    await runCancelPerpOpenOrders(queryClient, exchangeClient, intent.orderIds);
                } catch (error) {
                    toast({
                        message:
                            error instanceof Error
                                ? error.message
                                : intent.orderIds.length > 1
                                  ? 'Failed to cancel orders'
                                  : 'Failed to cancel order',
                        type: 'error',
                        error,
                    });
                }

                return;
            }
            await marketCloseAll(intent.positions);
        },
        [exchangeClient, queryClient, marketCloseAll],
    );

    const handleConfirmCloseAll = useCallback(() => {
        if (!closeAllIntent) return;
        void executeCloseAll(closeAllIntent);
    }, [closeAllIntent, executeCloseAll]);

    return (
        <YStack paddingHorizontal={12} gap={16}>
            <PerpsTradeDetailTabs
                activeTab={activeTab}
                positionsCount={positions.length}
                ordersCount={openOrders.length}
                onTabChange={setActiveTab}
            />

            <XStack alignItems="center" justifyContent="space-between">
                <Button unstyled onPress={() => setShowCurrent((prev) => !prev)}>
                    <XStack gap={6} height={24} alignItems="center">
                        <CheckboxCheckedIcon />
                        <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                            Current symbol
                        </Text>
                    </XStack>
                </Button>
                <ButtonUI
                    unstyled
                    backgroundColor="$bg"
                    borderWidth={1}
                    borderColor="$borderSubdued"
                    borderRadius={16}
                    paddingHorizontal={16}
                    paddingVertical={4}
                    pressStyle={{ opacity: 0.75 }}
                    disabled={isCloseAllLoading}
                    onPress={isCloseAllLoading ? undefined : handleCloseAll}
                >
                    <Text color="$text" fontSize={14} lineHeight={18} fontWeight={500} textAlign="center">
                        Clear all
                    </Text>
                </ButtonUI>
            </XStack>

            {activeTab === 'positions' ? (
                <ActivePositions
                    positions={filteredPositions}
                    openOrders={openOrders}
                    onTpSl={handleOpenTpSl}
                    onViewOpenOrders={() => {
                        setActiveTab('orders');
                    }}
                />
            ) : (
                <OpenOrders openOrders={filteredOrders} />
            )}

            {closeSheetData ? (
                <ClosePositionSheet open={closeSheetOpen} onOpenChange={setCloseSheetOpen} data={closeSheetData} />
            ) : null}

            <AddToPositionSheet
                open={addSheetOpen}
                onOpenChange={setAddSheetOpen}
                data={addSheetData}
                loading={addSheetLoading}
                onConfirm={handleConfirmAdd}
            />

            {tpSlSheetData ? (
                <TpSlSheet
                    open={tpSlSheetOpen}
                    onOpenChange={handleTpSlSheetOpenChange}
                    data={tpSlSheetData}
                    loading={Boolean(tpSlSheetOpen && !tpSlCoinInfo)}
                    existingTp={
                        tpSlOrders.tpOrder
                            ? {
                                  triggerPx: tpSlOrders.tpOrder.triggerPx,
                                  onCancel: handleCancelTpOrder,
                              }
                            : undefined
                    }
                    existingSl={
                        tpSlOrders.slOrder
                            ? {
                                  triggerPx: tpSlOrders.slOrder.triggerPx,
                                  onCancel: handleCancelSlOrder,
                              }
                            : undefined
                    }
                    cancelLoading={cancelPerpLoading}
                    confirmLoading={submitTpSlLoading}
                    onConfirm={handleConfirmTpSl}
                />
            ) : null}

            <CloseAllConfirmSheet
                type={closeAllIntent?.kind === 'positions' ? 'position' : 'order'}
                open={closeAllConfirmOpen}
                onOpenChange={handleCloseAllConfirmOpenChange}
                onConfirm={handleConfirmCloseAll}
            />
        </YStack>
    );
});
