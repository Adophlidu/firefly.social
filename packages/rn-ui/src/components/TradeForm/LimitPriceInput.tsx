import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { Button, Text, XStack } from 'tamagui';

import { TokenAmountInput } from '@/components/TokenAmountInput';
import { OrderType } from '@/constants/enum';
import { limitPriceAtom, midPriceAtom, orderTypeAtom, priceDecimalAtom, setLimitPriceAtom } from '@/store/tradeForm';

interface LimitPriceInputProps {}

export const LimitPriceInput = memo<LimitPriceInputProps>(function LimitPriceInput() {
    const orderType = useAtomValue(orderTypeAtom);
    const midPrice = useAtomValue(midPriceAtom);
    const price = useAtomValue(limitPriceAtom);
    const setPrice = useSetAtom(setLimitPriceAtom);
    const priceDecimal = useAtomValue(priceDecimalAtom);

    if (orderType === OrderType.MARKET) {
        return (
            <XStack
                backgroundColor="#F8F7F9"
                borderRadius={6}
                borderWidth={1}
                borderColor="rgba(34, 33, 47, 0.03)"
                height={40}
                alignItems="center"
                justifyContent="center"
                paddingHorizontal={8}
                paddingVertical={5}
            >
                <Text fontSize={14} fontWeight={500} color="rgba(70, 70, 70, 0.40)">
                    Market Price
                </Text>
            </XStack>
        );
    }

    return (
        <XStack
            height={40}
            gap={4}
            alignItems="center"
            paddingHorizontal={8}
            borderRadius={6}
            borderWidth={1}
            borderColor="rgba(34, 33, 47, 0.15)"
        >
            <TokenAmountInput decimal={priceDecimal} value={price} width="100%" height="100%" onChangeText={setPrice} />
            <Text fontSize={14} flexShrink={0} fontWeight={500} color="rgba(70, 70, 70, 0.40)">
                USDC
            </Text>
            <Button.Text
                flexShrink={0}
                color="#5E69FF"
                fontSize={14}
                fontWeight={500}
                onPress={() => {
                    if (midPrice) {
                        setPrice(midPrice);
                    }
                }}
            >
                Mid
            </Button.Text>
        </XStack>
    );
});
