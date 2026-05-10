import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { Button, Text, XStack } from 'tamagui';

import { UsdPriceInput } from '@/components/UsdPriceInput';
import { OrderType } from '@/constants/enum';
import { formatPrice } from '@/helpers/formatPrice';
import { limitPriceAtom, midPriceAtom, orderTypeAtom, setLimitPriceAtom, sizeDecimalAtom } from '@/store/tradeForm';

interface LimitPriceInputProps {}

export const LimitPriceInput = memo<LimitPriceInputProps>(function LimitPriceInput() {
    const orderType = useAtomValue(orderTypeAtom);
    const midPrice = useAtomValue(midPriceAtom);
    const price = useAtomValue(limitPriceAtom);
    const setPrice = useSetAtom(setLimitPriceAtom);
    const szDecimals = useAtomValue(sizeDecimalAtom);

    if (orderType === OrderType.MARKET) {
        return (
            <XStack
                backgroundColor="$bgSubdued"
                borderRadius={6}
                borderWidth={1}
                borderColor="$bgHover"
                height={40}
                alignItems="center"
                justifyContent="center"
                paddingHorizontal={8}
                paddingVertical={5}
            >
                <Text fontSize={14} fontWeight={500} color="$textDisabled">
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
            borderColor="$borderSubdued"
        >
            <UsdPriceInput
                szDecimals={szDecimals}
                value={price}
                flex={1}
                minWidth={0}
                height="100%"
                onChangeText={setPrice}
            />
            <Text fontSize={14} flexShrink={0} fontWeight={500} color="$textDisabled">
                USDC
            </Text>
            <Button
                unstyled
                flexShrink={0}
                onPress={() => {
                    if (midPrice) {
                        setPrice(formatPrice(midPrice, szDecimals));
                    }
                }}
            >
                <Text color="$accent" fontSize={14} fontWeight={500}>
                    Mid
                </Text>
            </Button>
        </XStack>
    );
});
