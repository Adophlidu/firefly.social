import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { ScrollView, XStack, YStack } from 'tamagui';

import { PerpsTradeDetailHeader } from '@/components/PerpsTradeDetailHeader';
import { PerpsTradeOrderBookPanel } from '@/components/PerpsTradeOrderBookPanel';
import { TradeDetailTabs } from '@/components/TradeDetailTabs/index';
import { PerpsTradeForm } from '@/components/TradeForm/index';
import { formatFundingRate } from '@/helpers/formatFundingRate';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { PerpsTradeDetailSkeleton } from '@/skeletons/PerpsTradeDetailSkeleton';
import {
    coinIndexAtom,
    coinNameAtom,
    marketPriceAtom,
    midPriceAtom,
    setCoinNameAtom,
    sizeDecimalAtom,
} from '@/store/tradeForm';
import type { SubmitAddToPosition, SubmitTpSl } from '@/types/services';
import type { PerpsMeta } from '@/types/ui';

export interface PerpsTradeDetailProps {
    submitAddPosition?: SubmitAddToPosition;
    submitTpSlValue?: SubmitTpSl;
    coin?: string;
}

export const PerpsTradeDetail = memo<PerpsTradeDetailProps>(function PerpsTradeDetail({
    submitAddPosition,
    submitTpSlValue,
    coin,
}) {
    const coinName = useAtomValue(coinNameAtom);
    const setMarketPrice = useSetAtom(marketPriceAtom);
    const setMidPrice = useSetAtom(midPriceAtom);
    const setSizeDecimal = useSetAtom(sizeDecimalAtom);
    const setCoinName = useSetAtom(setCoinNameAtom);
    const setCoinIndex = useSetAtom(coinIndexAtom);

    const { data: coinInfo, isLoading: isCoinInfoLoading } = useCoinInfo(coinName);

    // TODO: Max leverage is determined by coin info and user balance
    const maxLeverage = useMemo(() => {
        if (!coinInfo?.maxLeverage) return 1;

        return coinInfo.maxLeverage;
    }, [coinInfo?.maxLeverage]);

    const onCoinChange = useCallback(
        (meta: PerpsMeta) => {
            setCoinName(meta.name);
        },
        [setCoinName],
    );

    useEffect(() => {
        if (!coinInfo?.assetCtx) {
            setMarketPrice('0');
            setMidPrice('0');
            return;
        }

        const marketPrice = coinInfo.assetCtx.markPx || '0';
        setMarketPrice(marketPrice);
        setMidPrice(coinInfo.assetCtx.midPx || marketPrice);
    }, [coinInfo?.assetCtx, setMarketPrice, setMidPrice]);
    useEffect(() => {
        setSizeDecimal(coinInfo?.szDecimals || 1);
    }, [coinInfo?.szDecimals, setSizeDecimal]);
    useEffect(() => {
        setCoinIndex(coinInfo?.index ?? null);
    }, [coinInfo?.index, setCoinIndex]);
    useEffect(() => {
        if (coin) {
            setCoinName(coin);
        }
    }, [coin, setCoinName]);

    if (isCoinInfoLoading || !coinInfo) {
        return <PerpsTradeDetailSkeleton />;
    }

    return (
        <YStack fullscreen minHeight={0} backgroundColor="#FFFFFF">
            <PerpsTradeDetailHeader available={'0'} coin={coinInfo} onTokenSelect={onCoinChange} />

            <ScrollView flex={1} minHeight={0} showsVerticalScrollIndicator={false}>
                <YStack gap={12}>
                    {/* Order Book + Trade Form */}
                    <XStack paddingHorizontal={12} gap={8} alignItems="flex-start" justifyContent="center">
                        <XStack flex={3} flexBasis="0%">
                            <PerpsTradeOrderBookPanel
                                fundingRate={
                                    coinInfo.assetCtx?.funding ? formatFundingRate(coinInfo.assetCtx.funding) : '-'
                                }
                                midPrice={coinInfo.assetCtx?.midPx || coinInfo.assetCtx?.markPx || '0'}
                                szDecimals={coinInfo.szDecimals}
                            />
                        </XStack>
                        <XStack flex={4} flexBasis="0%">
                            <PerpsTradeForm
                                marginMode={coinInfo.marginMode}
                                maxLeverage={maxLeverage}
                                coinIndex={coinInfo.index}
                            />
                        </XStack>
                    </XStack>

                    <TradeDetailTabs
                        market={''}
                        submitAddPosition={submitAddPosition}
                        submitTpSlValue={submitTpSlValue}
                    />
                </YStack>
            </ScrollView>
        </YStack>
    );
});
