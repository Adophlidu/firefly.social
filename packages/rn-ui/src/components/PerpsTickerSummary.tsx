import { BigNumber } from 'bignumber.js';
import { memo } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { formatPrice } from '@/helpers/formatPrice';
import { nFormatter } from '@/helpers/nFormatter';
import { multipliedBy } from '@/helpers/number';
import type { CoinInfo } from '@/types/ui';

interface PerpsTickerSummaryProps {
    coinInfo: CoinInfo;
}

export const PerpsTickerSummary = memo<PerpsTickerSummaryProps>(function PerpsTickerSummary({ coinInfo }) {
    const volume = coinInfo.assetCtx?.dayNtlVlm
        ? nFormatter(BigNumber(coinInfo.assetCtx.dayNtlVlm).toNumber())
        : undefined;
    const openInterest = coinInfo.assetCtx?.openInterest
        ? nFormatter(multipliedBy(coinInfo.assetCtx.openInterest, coinInfo.assetCtx.markPx || '0').toNumber())
        : undefined;

    const symbol = coinInfo.priceDiff !== undefined ? (coinInfo.priceDiff >= 0 ? '+' : '') : '';
    const priceColor = coinInfo.priceDiff !== undefined ? (coinInfo.priceDiff >= 0 ? '#429F37' : '#FF564D') : '#171717';

    return (
        <XStack justifyContent="space-between" alignItems="flex-start" gap={12} width="100%">
            <YStack gap={2}>
                <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                    Last Price
                </Text>

                <Text color="#429F37" fontSize={24} lineHeight={32} fontWeight={700}>
                    {coinInfo.assetCtx?.midPx ? formatPrice(coinInfo.assetCtx?.midPx, coinInfo.szDecimals) : '-'}
                </Text>

                {coinInfo.priceDiff !== undefined ? (
                    <XStack gap={4} alignItems="center">
                        <Text color={priceColor} fontSize={12} lineHeight={14} fontWeight={500}>
                            {symbol}
                            {coinInfo.priceDiff ? formatPrice(coinInfo.priceDiff, coinInfo.szDecimals) : '-'}
                        </Text>
                        <Text color={priceColor} fontSize={12} lineHeight={14} fontWeight={500}>
                            {coinInfo.priceDiffRatio ? `${symbol}${coinInfo.priceDiffRatio.toFixed(2)}%` : '-'}
                        </Text>
                    </XStack>
                ) : null}

                <XStack gap={4} alignItems="center">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Mark Price
                    </Text>
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {coinInfo.assetCtx?.markPx ? formatPrice(coinInfo.assetCtx.markPx, coinInfo.szDecimals) : '-'}
                    </Text>
                </XStack>
            </YStack>

            <YStack width={160} gap={8} paddingTop={4}>
                <XStack alignItems="center" justifyContent="space-between">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        24h Volume
                    </Text>

                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {volume ? `$${volume}` : '-'}
                    </Text>
                </XStack>
                <XStack alignItems="center" justifyContent="space-between">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Open Interest
                    </Text>

                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {openInterest ? `$${openInterest}` : '-'}
                    </Text>
                </XStack>
                <XStack alignItems="center" justifyContent="space-between">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Funding
                    </Text>

                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {coinInfo.assetCtx?.funding
                            ? `${multipliedBy(coinInfo.assetCtx.funding, 100).toFixed(4)}%`
                            : '-'}
                    </Text>
                </XStack>
            </YStack>
        </XStack>
    );
});
