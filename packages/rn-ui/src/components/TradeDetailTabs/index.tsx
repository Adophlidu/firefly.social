import { useAtomValue } from 'jotai';
import { memo, useCallback, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { AddToPositionSheet } from '@/components/AddToPositionSheet';
import { ButtonUI } from '@/components/ButtonUI';
import { ClosePositionSheet } from '@/components/ClosePositionSheet';
import { type PerpsTradeDetailTab, PerpsTradeDetailTabs } from '@/components/PerpsTradeDetailTabs';
import { CloseAllConfirmSheet } from '@/components/Sheets/CloseAllConfirmSheet';
import { TpSlSheet } from '@/components/TpSlSheet';
import { ActivePositions } from '@/components/TradeDetailTabs/ActivePositions';
import { OpenOrders } from '@/components/TradeDetailTabs/OpenOrders';
import { useActivePositions } from '@/hooks/Perps/useActivePositions';
import { useCancelOrders } from '@/hooks/Perps/useCancelOrders';
import { useOpenOrders } from '@/hooks/Perps/useOpenOrders';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { submitAddToPosition } from '@/services/addToPosition';
import { submitTpSl } from '@/services/tpSl';
import { coinNameAtom } from '@/store/tradeForm';
import type { SubmitAddToPosition, SubmitTpSl } from '@/types/services';
import type { AddToPositionSheetData, ClosePositionSheetData, PerpsPositionItem, TpSlSheetData } from '@/types/ui';

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
    const [tpSlSheetLoading] = useState(false);
    const [closeAllConfirmOpen, setCloseAllConfirmOpen] = useState(false);
    const [tpSlSheetData] = useState<TpSlSheetData>(defaultTpSlData);
    const [showCurrent, setShowCurrent] = useState(false);

    const coinName = useAtomValue(coinNameAtom);

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

    const submitTpSlHandler = useMemo(() => {
        return submitTpSlValue ?? submitTpSl;
    }, [submitTpSlValue]);

    const handleCloseAll = useCallback(() => {
        const list = activeTab === 'positions' ? filteredPositions : filteredOrders;
        if (!list.length) return;

        setCloseAllConfirmOpen(true);
    }, [activeTab, filteredOrders, filteredPositions]);

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

    const onTpSl = useCallback(() => {
        setActiveTab('orders');
    }, []);

    const orderCancels = useMemo(
        () => filteredOrders.map((order) => ({ oid: order.oid, coin: order.coin })),
        [filteredOrders],
    );
    const [, cancelOrders] = useCancelOrders(orderCancels);
    const [{ loading: isCancelAllLoading }, cancelAll] = useAsyncFn(async () => {
        if (activeTab === 'orders') {
            await cancelOrders();
            return;
        }
    }, [activeTab, cancelOrders]);

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
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            Current symbol
                        </Text>
                    </XStack>
                </Button>
                <ButtonUI
                    unstyled
                    backgroundColor="#FFFFFF"
                    borderWidth={1}
                    borderColor="rgba(0, 0, 0, 0.06)"
                    borderRadius={16}
                    paddingHorizontal={16}
                    paddingVertical={4}
                    pressStyle={{ opacity: 0.75 }}
                    disabled={isCancelAllLoading}
                    onPress={isCancelAllLoading ? undefined : handleCloseAll}
                >
                    <Text color="#171717" fontSize={14} lineHeight={18} fontWeight={500} textAlign="center">
                        Clear all
                    </Text>
                </ButtonUI>
            </XStack>

            {activeTab === 'positions' ? (
                <ActivePositions positions={filteredPositions} onTpSl={onTpSl} />
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

            <TpSlSheet
                open={tpSlSheetOpen}
                onOpenChange={setTpSlSheetOpen}
                data={tpSlSheetData}
                loading={tpSlSheetLoading}
                onConfirm={handleConfirmTpSl}
            />

            <CloseAllConfirmSheet
                type={activeTab === 'positions' ? 'position' : 'order'}
                open={closeAllConfirmOpen}
                onOpenChange={setCloseAllConfirmOpen}
                onConfirm={cancelAll}
            />
        </YStack>
    );
});
