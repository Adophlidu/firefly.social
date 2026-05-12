import type { ReactNode } from 'react';
import { Button, Text, YStack } from 'tamagui';

import { navigate } from '@/helpers/navigate';
import { FallbackIcon } from '@/icons/FallbackIcon';

interface NoDataFallbackProps {
    message?: ReactNode;
    hideButton?: boolean;
}

export function NoDataFallback({ message, hideButton = false }: NoDataFallbackProps) {
    return (
        <YStack alignItems="center" width="100%" paddingVertical={40} paddingHorizontal={20}>
            <FallbackIcon />
            <Text fontWeight={500} fontSize={14} color="$textTertiary">
                {message || 'No data available'}
            </Text>
            {!hideButton ? (
                <Button
                    unstyled
                    height={40}
                    borderRadius={40}
                    backgroundColor="$text"
                    marginTop={24}
                    justifyContent="center"
                    width="90%"
                    maxWidth={319}
                    onPress={() => {
                        navigate('perps-website', {});
                    }}
                >
                    <Text fontSize={14} fontWeight={700} textAlign="center" color="$bgHover">
                        Learn more about Perps
                    </Text>
                </Button>
            ) : null}
        </YStack>
    );
}
