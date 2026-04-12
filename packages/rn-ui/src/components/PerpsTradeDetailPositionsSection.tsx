import { memo, useCallback, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { AddToPositionSheet } from '@/../../../packages/rn-ui/src/components/AddToPositionSheet';
import { ClosePositionSheet } from '@/../../../packages/rn-ui/src/components/ClosePositionSheet';
import { PerpsPositionCard } from '@/../../../packages/rn-ui/src/components/PerpsPositionCard';
import {
    type PerpsTradeDetailTab,
    PerpsTradeDetailTabs,
} from '@/../../../packages/rn-ui/src/components/PerpsTradeDetailTabs';
import { TpSlSheet } from '@/../../../packages/rn-ui/src/components/TpSlSheet';
import { RemoveIcon } from '@/icons/RemoveIcon';
import { loadAddToPositionSheet, submitAddToPosition } from '@/services/addToPosition';
import { loadTpSlSheet, submitTpSl } from '@/services/tpSl';
import type { FetchAddToPositionSheet, FetchTpSlSheet, SubmitAddToPosition, SubmitTpSl } from '@/types/services';
import type {
    AddToPositionSheetData,
    ClosePositionSheetData,
    PerpsOpenOrderItem,
    PerpsPositionItem,
    TpSlSheetData,
} from '@/types/ui';

interface PerpsTradeDetailPositionsSectionProps {
    market: string;
    positions: PerpsPositionItem[];
    openOrders: PerpsOpenOrderItem[];
    openOrdersCount: number;
    lastPrice: string;
    available: string;
    fetchAddToPositionSheet?: FetchAddToPositionSheet;
    submitAddPosition?: SubmitAddToPosition;
    fetchTpSlSheet?: FetchTpSlSheet;
    submitTpSlValue?: SubmitTpSl;
    onHistoryPress?: () => void;
}

const defaultAddToPositionData: AddToPositionSheetData = {
    symbol: 'BTC',
    currentPrice: '$70,401',
    defaultAmount: '10.19',
    minimumAmount: 5.05,
    liquidationPrice: '$92,356',
    newTotal: '$110.21',
};

const defaultTpSlData: TpSlSheetData = {
    symbol: 'BTCUSDC',
    entryPrice: '68,523',
    markPrice: '72,101',
    estimatedLiqPrice: '32,538',
    tpPrice: '',
    tpOperator: '+',
    tpType: 'percent',
    slPrice: '',
    slOperator: '-',
    slType: 'percent',
};

function CheckboxCheckedIcon() {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M1.33 4.93C1.33 2.73 2.73 1.33 4.93 1.33H11.06C13.27 1.33 14.67 2.73 14.67 4.93V11.07C14.67 13.27 13.27 14.67 11.07 14.67H4.93C2.73 14.67 1.33 13.27 1.33 11.07V4.93Z"
                fill="#171717"
            />
            <Path
                d="M5.16 8L7.15 9.99L10.84 6.01"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function OpenOrderCard({ order }: { order: PerpsOpenOrderItem }) {
    const sideTone = order.side === 'buy';

    return (
        <YStack
            borderWidth={1}
            borderColor="rgba(34, 33, 47, 0.08)"
            borderRadius={16}
            backgroundColor="#FFFFFF"
            padding={12}
            gap={12}
        >
            <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap={10} flex={1} minWidth={0}>
                    <YStack
                        width={36}
                        height={36}
                        borderRadius={18}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor="#F0F0F0"
                    >
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={600}>
                            {order.symbol}
                        </Text>
                    </YStack>

                    <YStack flex={1} minWidth={0} gap={4}>
                        <Text color="#171717" fontSize={13} lineHeight={14} fontWeight={600}>
                            {order.symbol}
                        </Text>

                        <XStack gap={4} alignItems="center" flexWrap="wrap">
                            <XStack
                                backgroundColor="#EFEFF3"
                                borderRadius={96}
                                paddingHorizontal={6}
                                paddingVertical={2}
                            >
                                <Text color="#A9A6BC" fontSize={12} lineHeight={14} fontWeight={500}>
                                    {order.orderTypeLabel}
                                </Text>
                            </XStack>
                            <XStack
                                backgroundColor={sideTone ? '#DCF1D9' : '#FFE6E4'}
                                borderRadius={96}
                                paddingHorizontal={6}
                                paddingVertical={2}
                            >
                                <Text
                                    color={sideTone ? '#48AD3C' : '#FF564D'}
                                    fontSize={12}
                                    lineHeight={14}
                                    fontWeight={500}
                                >
                                    {sideTone ? 'Buy' : 'Sell'}
                                </Text>
                            </XStack>
                            {order.leverageLabel ? (
                                <XStack
                                    backgroundColor="#EFEFF3"
                                    borderRadius={96}
                                    paddingHorizontal={6}
                                    paddingVertical={2}
                                >
                                    <Text color="#A9A6BC" fontSize={12} lineHeight={14} fontWeight={500}>
                                        {order.leverageLabel}
                                    </Text>
                                </XStack>
                            ) : null}
                        </XStack>
                    </YStack>
                </XStack>

                <Button
                    unstyled
                    width={16}
                    height={16}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.72 }}
                    icon={<RemoveIcon />}
                />
            </XStack>

            {order.triggerCondition && order.unfilledSize ? (
                <>
                    <XStack justifyContent="space-between" gap={8}>
                        <YStack flex={1} gap={2}>
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                Trigger Condition
                            </Text>
                            <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                                {order.triggerCondition}
                            </Text>
                        </YStack>
                        <YStack flex={1} gap={2} alignItems="flex-end">
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                Unfilled / Size
                            </Text>
                            <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                                {order.unfilledSize}
                            </Text>
                        </YStack>
                    </XStack>

                    <XStack justifyContent="space-between" gap={8}>
                        <YStack flex={1} gap={2}>
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                Price
                            </Text>
                            <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                                {order.priceLabel ?? 'Market'}
                            </Text>
                        </YStack>
                        <YStack flex={1} alignItems="flex-end" justifyContent="flex-end">
                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} fontWeight={400}>
                                {order.createdAt}
                            </Text>
                        </YStack>
                    </XStack>
                </>
            ) : null}

            <XStack justifyContent="space-between" gap={8}>
                <YStack flex={1} gap={2}>
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Size
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.size}
                    </Text>
                </YStack>
                <YStack flex={1} gap={2} alignItems="center">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Filled
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.filled}
                    </Text>
                </YStack>
                <YStack flex={1} gap={2} alignItems="flex-end">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Order price
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.orderPrice}
                    </Text>
                </YStack>
            </XStack>

            {!order.triggerCondition ? (
                <XStack justifyContent="space-between" alignItems="center" gap={8}>
                    <XStack alignItems="center" gap={4}>
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                            TP/SL
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                            {order.tpSl ?? '-- / --'}
                        </Text>
                    </XStack>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} fontWeight={400}>
                        {order.createdAt}
                    </Text>
                </XStack>
            ) : null}
        </YStack>
    );
}

export const PerpsTradeDetailPositionsSection = memo<PerpsTradeDetailPositionsSectionProps>(
    function PerpsTradeDetailPositionsSection({
        market,
        positions,
        openOrders,
        openOrdersCount,
        lastPrice,
        available,
        fetchAddToPositionSheet,
        submitAddPosition,
        fetchTpSlSheet,
        submitTpSlValue,
        onHistoryPress,
    }) {
        const [activeTab, setActiveTab] = useState<PerpsTradeDetailTab>('positions');
        const [closeSheetOpen, setCloseSheetOpen] = useState(false);
        const [closeSheetData, setCloseSheetData] = useState<ClosePositionSheetData | null>(null);
        const [addSheetOpen, setAddSheetOpen] = useState(false);
        const [addSheetLoading, setAddSheetLoading] = useState(false);
        const [addSheetData, setAddSheetData] = useState<AddToPositionSheetData>(defaultAddToPositionData);
        const [activePosition, setActivePosition] = useState<PerpsPositionItem | null>(null);
        const [tpSlSheetOpen, setTpSlSheetOpen] = useState(false);
        const [tpSlSheetLoading, setTpSlSheetLoading] = useState(false);
        const [tpSlSheetData, setTpSlSheetData] = useState<TpSlSheetData>(defaultTpSlData);

        const loadAddSheetData = useMemo(() => {
            return fetchAddToPositionSheet ?? loadAddToPositionSheet;
        }, [fetchAddToPositionSheet]);

        const submitAdd = useMemo(() => {
            return submitAddPosition ?? submitAddToPosition;
        }, [submitAddPosition]);

        const loadTpSl = useMemo(() => {
            return fetchTpSlSheet ?? loadTpSlSheet;
        }, [fetchTpSlSheet]);

        const submitTpSlHandler = useMemo(() => {
            return submitTpSlValue ?? submitTpSl;
        }, [submitTpSlValue]);

        const buildCloseSheetData = useCallback(
            (position: PerpsPositionItem): ClosePositionSheetData => ({
                symbol: position.symbol,
                currentPrice: lastPrice,
                available,
                leverage: position.leverage,
                receive: '$92,356',
                estClosedPnl: position.pnl,
                estClosedPnlValue: position.pnlValue,
            }),
            [available, lastPrice],
        );

        const handleClosePosition = useCallback(
            (position: PerpsPositionItem) => {
                setCloseSheetData(buildCloseSheetData(position));
                setCloseSheetOpen(true);
            },
            [buildCloseSheetData],
        );

        const handleCloseAll = useCallback(() => {
            if (!positions.length) return;
            const first = positions[0];
            setCloseSheetData(buildCloseSheetData(first));
            setCloseSheetOpen(true);
        }, [positions, buildCloseSheetData]);

        const handleAddToPosition = useCallback(
            async (position: PerpsPositionItem) => {
                setActivePosition(position);
                setAddSheetOpen(true);
                setAddSheetLoading(true);

                try {
                    const response = await loadAddSheetData({
                        market,
                        positionId: position.id,
                    });
                    setAddSheetData(response.data);
                } finally {
                    setAddSheetLoading(false);
                }
            },
            [loadAddSheetData, market],
        );

        const handleConfirmAdd = useCallback(
            async (amount: number) => {
                if (!activePosition) return;
                await submitAdd({ market, positionId: activePosition.id, amount });
            },
            [activePosition, market, submitAdd],
        );

        const handleOpenTpSl = useCallback(
            async (position: PerpsPositionItem) => {
                setActivePosition(position);
                setTpSlSheetOpen(true);
                setTpSlSheetLoading(true);

                try {
                    const response = await loadTpSl({
                        market,
                        positionId: position.id,
                    });
                    setTpSlSheetData(response.data);
                } finally {
                    setTpSlSheetLoading(false);
                }
            },
            [loadTpSl, market],
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
            }) => {
                if (!activePosition) return;
                await submitTpSlHandler({
                    market,
                    positionId: activePosition.id,
                    tpPrice,
                    slPrice,
                    tpType,
                    slType,
                });
            },
            [activePosition, market, submitTpSlHandler],
        );

        return (
            <YStack paddingHorizontal={12} gap={16}>
                <PerpsTradeDetailTabs
                    activeTab={activeTab}
                    positionsCount={positions.length}
                    ordersCount={openOrdersCount}
                    onTabChange={setActiveTab}
                    onHistoryPress={onHistoryPress}
                />

                <XStack alignItems="center" justifyContent="space-between">
                    <XStack gap={6} height={24} alignItems="center">
                        <CheckboxCheckedIcon />
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            Current symbol
                        </Text>
                    </XStack>
                    <Button
                        unstyled
                        backgroundColor="#FFFFFF"
                        borderWidth={1}
                        borderColor="rgba(0, 0, 0, 0.06)"
                        borderRadius={16}
                        paddingHorizontal={16}
                        paddingVertical={4}
                        pressStyle={{ opacity: 0.75 }}
                    >
                        <Text color="#171717" fontSize={14} lineHeight={18} fontWeight={500} textAlign="center">
                            Clear all
                        </Text>
                    </Button>
                </XStack>

                {activeTab === 'positions' ? (
                    <YStack gap={16} paddingBottom={24}>
                        {positions.map((position) => (
                            <PerpsPositionCard
                                key={position.id}
                                position={position}
                                onClose={handleClosePosition}
                                onCloseAll={handleCloseAll}
                                onAddToPosition={handleAddToPosition}
                                onTpSl={handleOpenTpSl}
                            />
                        ))}
                    </YStack>
                ) : openOrders.length ? (
                    <YStack gap={16} paddingBottom={24}>
                        {openOrders.map((order) => (
                            <OpenOrderCard key={order.id} order={order} />
                        ))}
                    </YStack>
                ) : (
                    <YStack paddingVertical={40} alignItems="center">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={14} lineHeight={18}>
                            No open orders
                        </Text>
                    </YStack>
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

                <TpSlSheet
                    open={tpSlSheetOpen}
                    onOpenChange={setTpSlSheetOpen}
                    data={tpSlSheetData}
                    loading={tpSlSheetLoading}
                    onConfirm={handleConfirmTpSl}
                />
            </YStack>
        );
    },
);
