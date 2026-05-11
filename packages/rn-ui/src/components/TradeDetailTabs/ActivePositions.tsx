import { memo, useCallback, useMemo, useState } from 'react';
import { YStack } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { PerpsPositionCard } from '@/components/TradeDetailTabs/PerpsPositionCard';
import { buildPositionTpSlByCoin } from '@/helpers/perpsPositionTpsl';
import { useAdjustIsolatedMargin } from '@/hooks/Perps/useAdjustIsolatedMargin';
import { useClosePosition } from '@/hooks/Perps/useClosePosition';
import type { OpenOrder, Position } from '@/types/ui';

import { AddMarginSheet } from '../Sheets/AddMarginSheet';
import { LimitCloseSheet } from '../Sheets/LimitCloseSheet';

interface ActivePositionsProps {
    positions: Position[];
    openOrders: OpenOrder[];
    onTpSl?: (position: Position) => void;
    /** Switch to open orders tab (e.g. when TP/SL row shows “View orders”). */
    onViewOpenOrders?: () => void;
}

export const ActivePositions = memo<ActivePositionsProps>(function ActivePositions({
    positions,
    openOrders,
    onTpSl,
    onViewOpenOrders,
}) {
    const [limitSheetOpen, setLimitSheetOpen] = useState(false);
    const [closeType, setCloseType] = useState<'limit' | 'market'>('limit');
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [marginSheetOpen, setMarginSheetOpen] = useState(false);
    const [marginSheetPosition, setMarginSheetPosition] = useState<Position | null>(null);

    const handleLimitClose = useCallback((position: Position) => {
        setSelectedPosition(position);
        setCloseType('limit');
        setLimitSheetOpen(true);
    }, []);
    const handleMarketClose = useCallback((position: Position) => {
        setSelectedPosition(position);
        setCloseType('market');
        setLimitSheetOpen(true);
    }, []);

    const [{ loading: isClosing }, closePosition] = useClosePosition({
        coinName: selectedPosition?.coin,
        type: closeType,
        position: selectedPosition || undefined,
    });

    const [{ loading: isAdjustingMargin }, adjustIsolatedMargin] = useAdjustIsolatedMargin({
        coinName: marginSheetPosition?.coin,
        position: marginSheetPosition ?? undefined,
    });

    const handleAdjustMargin = useCallback((position: Position) => {
        setMarginSheetPosition(position);
        setMarginSheetOpen(true);
    }, []);

    const handleMarginSheetOpenChange = useCallback((open: boolean) => {
        setMarginSheetOpen(open);
        if (!open) {
            setMarginSheetPosition(null);
        }
    }, []);

    const handleMarginConfirm = useCallback(
        async (amountUsd: string) => {
            const success = await adjustIsolatedMargin(amountUsd);
            if (success) {
                setMarginSheetOpen(false);
                setMarginSheetPosition(null);
            }
        },
        [adjustIsolatedMargin],
    );

    const tpSlByCoin = useMemo(() => buildPositionTpSlByCoin(openOrders), [openOrders]);

    if (!positions.length) {
        return <NoDataFallback message="No open positions" />;
    }

    return (
        <>
            <YStack gap={16} paddingBottom={40}>
                {positions.map((position) => (
                    <PerpsPositionCard
                        position={position}
                        key={position.coin}
                        disabled={isClosing || isAdjustingMargin}
                        tpSl={tpSlByCoin.get(position.coin)}
                        onLimitClose={handleLimitClose}
                        onMarketClose={handleMarketClose}
                        onAdjustMargin={handleAdjustMargin}
                        onTpSl={onTpSl}
                        onViewOpenOrders={onViewOpenOrders}
                    />
                ))}
            </YStack>

            <LimitCloseSheet
                open={limitSheetOpen}
                onOpenChange={setLimitSheetOpen}
                size={selectedPosition?.szi || '0'}
                coinName={selectedPosition?.coin || ''}
                entryPrice={selectedPosition?.entryPx || '0'}
                type={closeType}
                onConfirm={closePosition}
            />

            <AddMarginSheet
                open={marginSheetOpen}
                onOpenChange={handleMarginSheetOpenChange}
                coinName={marginSheetPosition?.coin || ''}
                position={marginSheetPosition}
                onConfirm={handleMarginConfirm}
                isSubmitting={isAdjustingMargin}
            />
        </>
    );
});
