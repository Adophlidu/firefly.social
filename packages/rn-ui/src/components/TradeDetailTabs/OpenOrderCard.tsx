import { memo, useMemo } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { CoinAvatar } from '@/components/CoinAvatar';
import { formatCoinName } from '@/helpers/formatCoinName';
import { useCancelOrders } from '@/hooks/Perps/useCancelOrders';
import { RemoveIcon } from '@/icons/RemoveIcon';
import type { OpenOrder } from '@/types/ui';

interface OpenOrderCardProps {
    order: OpenOrder;
}

function formatOrderTime(timestamp: number) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export const OpenOrderCard = memo<OpenOrderCardProps>(function OpenOrderCard({ order }) {
    const isMainOrder = !order.isTrigger;

    const direction = useMemo(() => {
        if (!order.isTrigger) {
            return order.side === 'B' ? 'Long' : 'Short';
        }

        if (order.side === 'B') return 'Close Short';
        if (order.side === 'A') return 'Close Long';
        return '';
    }, [order.isTrigger, order.side]);

    const cancelInfo = useMemo(() => [{ oid: order.oid, coin: order.coin }], [order.oid, order.coin]);
    const [{ loading }, removeOrder] = useCancelOrders(cancelInfo);

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
                    <CoinAvatar name={order.coin} />

                    <YStack flex={1} minWidth={0} gap={4}>
                        <Text color="#171717" fontSize={13} lineHeight={14} fontWeight={600}>
                            {formatCoinName(order.coin)}
                        </Text>

                        <XStack gap={4} alignItems="center" flexWrap="wrap">
                            <XStack
                                backgroundColor={isMainOrder ? '#DCF1D9' : '#FFE6E4'}
                                borderRadius={96}
                                paddingHorizontal={6}
                                paddingVertical={2}
                            >
                                <Text
                                    color={isMainOrder ? '#48AD3C' : '#FF564D'}
                                    fontSize={12}
                                    lineHeight={14}
                                    fontWeight={500}
                                >
                                    {`${order.orderType}${direction ? ` / ${direction}` : ''}`}
                                </Text>
                            </XStack>
                            {/* {order.leverageLabel ? (
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
                            ) : null} */}
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
                    disabled={loading}
                    onPress={loading ? undefined : removeOrder}
                />
            </XStack>

            <XStack justifyContent="space-between" gap={8}>
                <YStack flex={1} gap={2}>
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Size
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.sz}
                    </Text>
                </YStack>
                <YStack flex={1} gap={2} alignItems="center">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Filled
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        -
                    </Text>
                </YStack>
                <YStack flex={1} gap={2} alignItems="flex-end">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Order price
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.isTrigger ? 'Market' : order.limitPx}
                    </Text>
                </YStack>
            </XStack>

            <XStack justifyContent="space-between" gap={8}>
                <YStack flex={1} gap={2}>
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Trigger Condition
                    </Text>
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={500}>
                        {order.triggerCondition}
                    </Text>
                </YStack>
                <YStack flex={1} alignItems="flex-end" justifyContent="flex-end">
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} fontWeight={400}>
                        {formatOrderTime(order.timestamp)}
                    </Text>
                </YStack>
            </XStack>
        </YStack>
    );
});
