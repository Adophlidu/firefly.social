import { memo } from 'react';
import { Button, Text, XStack } from 'tamagui';

import type { PerpsDetailActionButton } from '@/types/ui';

interface PerpsTradeActionBarProps {
    actions: PerpsDetailActionButton[];
}

export const PerpsTradeActionBar = memo<PerpsTradeActionBarProps>(function PerpsTradeActionBar({ actions }) {
    return (
        <XStack width="100%" gap={10}>
            {actions.map((action) => {
                const backgroundColor = action.tone === 'buy' ? '#3A9B35' : '#FF3C33';

                return (
                    <Button
                        key={action.label}
                        unstyled
                        flex={1}
                        height={60}
                        borderRadius={100}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                        shadowColor={action.tone === 'buy' ? '#3A9B35' : '#FF3C33'}
                        shadowOpacity={0.12}
                        shadowRadius={8}
                        shadowOffset={{ width: 0, height: 4 }}
                        pressStyle={{ opacity: 0.9, scale: 0.99 }}
                    >
                        <Text color="#FFFFFF" fontSize={16} lineHeight={24} fontWeight={700}>
                            {action.label}
                        </Text>
                    </Button>
                );
            })}
        </XStack>
    );
});
