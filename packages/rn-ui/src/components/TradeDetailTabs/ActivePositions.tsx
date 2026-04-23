import { memo, useCallback, useState } from 'react';
import { YStack } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { PerpsPositionCard } from '@/components/TradeDetailTabs/PerpsPositionCard';
import { useClosePosition } from '@/hooks/Perps/useClosePosition';
import type { Position } from '@/types/ui';

import { LimitCloseSheet } from '../Sheets/LimitCloseSheet';

interface ActivePositionsProps {
    positions: Position[];
}

export const ActivePositions = memo<ActivePositionsProps>(function ActivePositions({ positions }) {
    const [limitSheetOpen, setLimitSheetOpen] = useState(false);
    const [closeType, setCloseType] = useState<'limit' | 'market'>('limit');
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

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
                        disabled={isClosing}
                        onLimitClose={handleLimitClose}
                        onMarketClose={handleMarketClose}
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
        </>
    );
});
