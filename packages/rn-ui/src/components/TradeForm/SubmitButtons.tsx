import { memo } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { SubmitButtonItem } from '@/components/TradeForm/SubmitButtonItem';
import { formatAmount } from '@/helpers/formatAmount';
import { useLiquidationPrice } from '@/hooks/Perps/useLiquidationPrice';
import { useMarginRequired } from '@/hooks/Perps/useMarginRequired';
import { useSubmitOrder } from '@/hooks/Perps/useSubmitOrder';

interface SubmitButtonsProps {
    maxLeverage: number;
}

export const SubmitButtons = memo<SubmitButtonsProps>(function SubmitButtons({ maxLeverage }) {
    const { buy: buyLiquidationPrice, sell: sellLiquidationPrice } = useLiquidationPrice(maxLeverage);
    const marginRequired = useMarginRequired();

    const [{ loading }, submitOrder] = useSubmitOrder();

    return (
        <>
            {/* Buy/Long Section */}
            <YStack gap={2}>
                <YStack>
                    <XStack height={24} alignItems="center" justifyContent="space-between">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                            Est. Liq. price
                        </Text>
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            {buyLiquidationPrice ? formatAmount(buyLiquidationPrice) : '-'}
                        </Text>
                    </XStack>
                    <XStack height={24} alignItems="center" justifyContent="space-between">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                            Cost
                        </Text>
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            {marginRequired ? `${marginRequired} USDC` : '-'}
                        </Text>
                    </XStack>
                </YStack>
                <SubmitButtonItem isLong loading={loading} onPress={() => submitOrder(true)} />
            </YStack>

            {/* Sell/Short Section */}
            <YStack gap={2}>
                <YStack>
                    <XStack height={24} alignItems="center" justifyContent="space-between">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                            Est. Liq. price
                        </Text>
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            {sellLiquidationPrice ? formatAmount(sellLiquidationPrice) : '-'}
                        </Text>
                    </XStack>
                    <XStack height={24} alignItems="center" justifyContent="space-between">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                            Cost
                        </Text>
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            {marginRequired ? `${marginRequired} USDC` : '-'}
                        </Text>
                    </XStack>
                </YStack>
                <SubmitButtonItem isLong={false} loading={loading} onPress={() => submitOrder(false)} />
            </YStack>
        </>
    );
});
