import type { ReactNode } from 'react';
import { Button, Text, YStack } from 'tamagui';

import { FallbackIcon } from '@/icons/FallbackIcon';

interface NoDataFallbackProps {
    message?: ReactNode;
}

export function NoDataFallback({ message }: NoDataFallbackProps) {
    return (
        <YStack alignItems="center" width="100%" paddingVertical={40} paddingHorizontal={20}>
            <FallbackIcon />
            <Text fontWeight={500} fontSize={14} color="#9EA1B0">
                {message || 'No data available'}
            </Text>
            <Button
                unstyled
                height={40}
                borderRadius={40}
                backgroundColor="#000000"
                marginTop={24}
                justifyContent="center"
                width="90%"
                maxWidth={319}
            >
                <Text fontSize={14} fontWeight={700} textAlign="center" color="#E8E8E8">
                    Learn more about Perps
                </Text>
            </Button>
        </YStack>
    );
}
