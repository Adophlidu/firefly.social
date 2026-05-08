import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { memo, useMemo } from 'react';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { CoinAvatar } from '@/components/CoinAvatar';
import { NoDataFallback } from '@/components/NoDataFallback';
import { formatCoinName } from '@/helpers/formatCoinName';
import { multipliedBy } from '@/helpers/number';
import { infoClient } from '@/providers/client';
import { TradingHistorySkeleton } from '@/skeletons/TradingHistorySkeleton';
import type { UserFill } from '@/types/ui';

export interface TradingHistoryProps {
    walletAddress: string;
}

interface TradingHistoryItemCardProps {
    item: UserFill;
}

const TradingHistoryItemCard = memo<TradingHistoryItemCardProps>(function TradingHistoryItemCard({ item }) {
    const directionInfo = useMemo(() => {
        const side = item.side;
        let directionColor = '#429F37';
        if (side === 'A') {
            directionColor = '#FF372B';
        }

        let directionStr = item.dir;
        if (item.liquidation?.method) {
            const liqPrefix = item.liquidation.method === 'backstop' ? 'Backstop Liq' : 'Market Liq';
            directionStr = `${liqPrefix}: ${item.dir}`;
        }

        return { directionStr, directionColor };
    }, [item.side, item.dir, item.liquidation?.method]);
    const closePnlInfo = useMemo(() => {
        const closePnl = item.closedPnl;
        const closePnlBN = new BigNumber(closePnl).minus(new BigNumber(item.fee));
        let closePnlPlusOrMinus = '';
        let closePnlColor = '#429F37';
        if (closePnlBN.lt(0)) {
            closePnlColor = '#FF372B';
            closePnlPlusOrMinus = '-';
        }
        const closePnlStr = closePnlBN.abs().toFixed();
        return { closePnlFormatted: closePnlStr, closePnlColor, closePnlPlusOrMinus };
    }, [item.closedPnl, item.fee]);

    const coinName = formatCoinName(item.coin);

    return (
        <YStack backgroundColor="#FFFFFF" borderWidth={1} borderColor="#F0F0F0" borderRadius={12} padding={12} gap={12}>
            <XStack alignItems="center" gap={8}>
                <CoinAvatar name={item.coin} size={36} />

                <YStack flex={1} gap={2}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {coinName}
                    </Text>
                    <Text color={directionInfo.directionColor} fontSize={12} lineHeight={14}>
                        {directionInfo.directionStr}
                    </Text>
                </YStack>

                {item.closedPnl ? (
                    <Text color={closePnlInfo.closePnlColor} fontSize={14} lineHeight={20} fontWeight={600}>
                        {closePnlInfo.closePnlPlusOrMinus}${closePnlInfo.closePnlFormatted}
                    </Text>
                ) : null}
            </XStack>

            <XStack gap={8}>
                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.px}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Price
                    </Text>
                </YStack>

                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.sz} {coinName}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Position Size
                    </Text>
                </YStack>

                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {multipliedBy(item.px, item.sz).toFormat(2)} {item.feeToken || 'USDC'}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Trade Value
                    </Text>
                </YStack>
            </XStack>

            <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                {new Date(item.time).toLocaleString()}
            </Text>
        </YStack>
    );
});

export const TradingHistory = memo<TradingHistoryProps>(function TradingHistory({ walletAddress }) {
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['tradingHistory', walletAddress],
        enabled: !!walletAddress,
        queryFn: async () => {
            const data = await infoClient.userFills({
                user: walletAddress,
                aggregateByTime: true,
            });
            return data;
        },
    });

    if (!walletAddress) {
        return (
            <XStack justifyContent="center" paddingVertical={20}>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    Wallet: --
                </Text>
            </XStack>
        );
    }

    if (isLoading) {
        return <TradingHistorySkeleton />;
    }
    if (error && !data?.length) {
        return (
            <YStack alignItems="center" justifyContent="center" gap={8} paddingVertical={20}>
                <Text color="#FF372B" fontSize={12} lineHeight={14}>
                    Failed to load trading history
                </Text>
                <Button
                    unstyled
                    backgroundColor="#F8F7F9"
                    borderWidth={1}
                    borderColor="#F0F0F0"
                    borderRadius={8}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    pressStyle={{ opacity: 0.75 }}
                    onPress={() => {
                        void refetch();
                    }}
                >
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={600}>
                        {isRefetching ? 'Retrying...' : 'Retry'}
                    </Text>
                </Button>
            </YStack>
        );
    }
    if (!data?.length) {
        return <NoDataFallback />;
    }

    return (
        <ScrollView flex={1} minHeight={0} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
            <YStack gap={12} paddingBottom={16}>
                {data.map((item) => (
                    <TradingHistoryItemCard key={`${item.oid}-${item.hash}`} item={item} />
                ))}

                {error ? (
                    <YStack alignItems="center" gap={8} paddingTop={4}>
                        <Text color="#FF372B" fontSize={12} lineHeight={14}>
                            Failed to refresh trading history
                        </Text>
                        <Button
                            unstyled
                            backgroundColor="#F8F7F9"
                            borderWidth={1}
                            borderColor="#F0F0F0"
                            borderRadius={8}
                            paddingHorizontal={12}
                            paddingVertical={6}
                            pressStyle={{ opacity: 0.75 }}
                            onPress={() => {
                                void refetch();
                            }}
                        >
                            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={600}>
                                {isRefetching ? 'Retrying...' : 'Retry'}
                            </Text>
                        </Button>
                    </YStack>
                ) : null}
            </YStack>
        </ScrollView>
    );
});
