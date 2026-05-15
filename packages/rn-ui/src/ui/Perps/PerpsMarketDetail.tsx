import { memo, useCallback, useState } from 'react';
import { ScrollView, YStack } from 'tamagui';

import { OrderBook } from '@/components/OrderBook';
import { PerpsDetailTopBar } from '@/components/PerpsDetailTopBar';
import { PerpsKline } from '@/components/PerpsKline/PerpsKline';
import { PerpsTickerSummary } from '@/components/PerpsTickerSummary';
import { PerpsTokenSelectSheet } from '@/components/PerpsTokenSelectSheet';
import { PerpsTradeActionBar } from '@/components/PerpsTradeActionBar';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { PerpsDetailSkeleton } from '@/skeletons/PerpsDetailSkeleton';
import type { PerpsMeta } from '@/types/ui';

export interface PerpsMarketDetailProps {
    coin: string;
}

export const PerpsMarketDetail = memo<PerpsMarketDetailProps>(function PerpsMarketDetail({ coin }) {
    const [currentCoin, setCurrentCoin] = useState(coin);
    const [isTokenSelectorOpen, setTokenSelectorOpen] = useState(false);
    const [isKlineInteracting, setKlineInteracting] = useState(false);

    const { data: coinInfo } = useCoinInfo(currentCoin);

    const onTokenChange = useCallback((meta: PerpsMeta) => {
        setCurrentCoin(meta.name);
        setTokenSelectorOpen(false);
    }, []);
    const onOpenSelector = useCallback(() => {
        setTokenSelectorOpen(true);
    }, []);
    const onKlineInteractionStart = useCallback(() => {
        setKlineInteracting(true);
    }, []);
    const onKlineInteractionEnd = useCallback(() => {
        setKlineInteracting(false);
    }, []);

    if (!coinInfo) {
        return <PerpsDetailSkeleton />;
    }

    return (
        <YStack fullscreen height="100%" minHeight={0} backgroundColor="$bg">
            <YStack paddingTop={2}>
                <PerpsDetailTopBar
                    symbol={coinInfo.name}
                    leverage={`${coinInfo.maxLeverage}`}
                    marketType={coinInfo.dex || 'Perp'}
                    onOpenSelector={onOpenSelector}
                />
            </YStack>

            <ScrollView flex={1} minHeight={0} scrollEnabled={!isKlineInteracting} showsVerticalScrollIndicator={false}>
                <YStack paddingHorizontal={12} paddingTop={6} paddingBottom={8} gap={14}>
                    <PerpsTickerSummary coinInfo={coinInfo} />
                    <PerpsKline
                        coin={currentCoin}
                        onInteractionStart={onKlineInteractionStart}
                        onInteractionEnd={onKlineInteractionEnd}
                    />
                    <OrderBook
                        coin={currentCoin}
                        szDecimal={coinInfo.szDecimals}
                        midPrice={coinInfo.assetCtx?.midPx || coinInfo.assetCtx?.markPx || '0'}
                    />
                </YStack>
            </ScrollView>

            <YStack paddingHorizontal={12} paddingTop={8} paddingBottom={12}>
                <PerpsTradeActionBar coin={currentCoin} />
            </YStack>

            <PerpsTokenSelectSheet
                open={isTokenSelectorOpen}
                onOpenChange={setTokenSelectorOpen}
                onTokenSelected={onTokenChange}
            />
        </YStack>
    );
});
