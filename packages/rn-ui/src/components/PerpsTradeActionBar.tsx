import { memo, useCallback } from 'react';
import { Button, Text, XStack } from 'tamagui';

import { navigate } from '@/helpers/navigate';

interface PerpsTradeActionBarProps {
    coin: string;
}

export const PerpsTradeActionBar = memo<PerpsTradeActionBarProps>(function PerpsTradeActionBar({ coin }) {
    const goToTrade = useCallback(() => {
        navigate('trade', { coin });
    }, [coin]);

    return (
        <XStack width="100%" gap={10}>
            <Button
                unstyled
                flex={1}
                height={48}
                borderRadius={100}
                backgroundColor="#3A9B35"
                alignItems="center"
                justifyContent="center"
                shadowColor="#3A9B35"
                shadowOpacity={0.12}
                shadowRadius={8}
                shadowOffset={{ width: 0, height: 4 }}
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                onPress={goToTrade}
            >
                <Text color="#FFFFFF" fontSize={16} lineHeight={24} fontWeight={700}>
                    Buy/Long
                </Text>
            </Button>
            <Button
                unstyled
                flex={1}
                height={48}
                borderRadius={100}
                backgroundColor="#FF3C33"
                alignItems="center"
                justifyContent="center"
                shadowColor="#FF3C33"
                shadowOpacity={0.12}
                shadowRadius={8}
                shadowOffset={{ width: 0, height: 4 }}
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                onPress={goToTrade}
            >
                <Text color="#FFFFFF" fontSize={16} lineHeight={24} fontWeight={700}>
                    Sell/Short
                </Text>
            </Button>
        </XStack>
    );
});
