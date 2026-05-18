import { Trans } from '@lingui/react/macro';
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
                backgroundColor="$textSuccess"
                alignItems="center"
                justifyContent="center"
                shadowColor="$textSuccess"
                shadowOpacity={0.12}
                shadowRadius={8}
                shadowOffset={{ width: 0, height: 4 }}
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                onPress={goToTrade}
            >
                <Text color="$bg" fontSize={16} lineHeight={24} fontWeight={700}>
                    <Trans id="rn-ui.trade-form.buy-long">Buy/Long</Trans>
                </Text>
            </Button>
            <Button
                unstyled
                flex={1}
                height={48}
                borderRadius={100}
                backgroundColor="$textCritical"
                alignItems="center"
                justifyContent="center"
                shadowColor="$textCritical"
                shadowOpacity={0.12}
                shadowRadius={8}
                shadowOffset={{ width: 0, height: 4 }}
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                onPress={goToTrade}
            >
                <Text color="$bg" fontSize={16} lineHeight={24} fontWeight={700}>
                    <Trans id="rn-ui.trade-form.sell-short">Sell/Short</Trans>
                </Text>
            </Button>
        </XStack>
    );
});
