import { memo } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

const intervals = ['1m', '15m', '1h', '4h', 'D'] as const;

export const PerpsKlinePlaceholder = memo(function PerpsKlinePlaceholder() {
    return (
        <YStack width="100%" gap={8}>
            <XStack alignItems="center" gap={12}>
                {intervals.map((interval, index) => (
                    <Button
                        key={interval}
                        unstyled
                        paddingHorizontal={2}
                        minWidth={20}
                        justifyContent="center"
                        alignItems="center"
                        pressStyle={{ opacity: 0.75 }}
                    >
                        <Text
                            color={index === 2 ? '$text' : '$textDisabled'}
                            fontSize={13}
                            lineHeight={17}
                            fontWeight={500}
                        >
                            {interval}
                        </Text>
                    </Button>
                ))}
            </XStack>

            <YStack
                height={320}
                borderRadius={10}
                borderWidth={1}
                borderColor="$bgSubdued"
                backgroundColor="$bgSubdued"
                justifyContent="center"
                alignItems="center"
                overflow="hidden"
            >
                <Text color="$textSubdued" fontSize={13} lineHeight={17} fontWeight={500}>
                    K-line area placeholder
                </Text>
            </YStack>

            <YStack gap={8}>
                <Text color="$textSubdued" fontSize={12} lineHeight={14} fontWeight={500}>
                    Volume
                </Text>

                <XStack alignItems="flex-end" gap={6} height={72}>
                    {Array.from({ length: 14 }, (_, index) => {
                        const barHeight = 14 + ((index * 9) % 58);
                        const color = index % 2 === 0 ? 'rgba(72, 173, 60, 0.45)' : 'rgba(255, 86, 77, 0.4)';

                        return (
                            <YStack key={index} width={8} height={barHeight} borderRadius={3} backgroundColor={color} />
                        );
                    })}
                </XStack>
            </YStack>
        </YStack>
    );
});
