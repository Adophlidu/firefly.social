import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, YStack } from 'tamagui';

import { useAsyncFn } from '@/hooks/useAsyncFn';

interface WithdrawButtonProps {
    onPress?: () => Promise<string>;
}

export const WithdrawButton = memo<WithdrawButtonProps>(function WithdrawButton({ onPress }) {
    const [{ loading, error }, handlePress] = useAsyncFn(async () => {
        try {
            if (typeof onPress === 'function') {
                return await onPress();
            }
        } catch {}
    }, [onPress]);

    return (
        <Button
            unstyled
            height={64}
            width={'100%'}
            backgroundColor="#F8F7F9"
            pressStyle={{
                scale: 0.98,
            }}
            flex={1}
            borderRadius={15}
            disabled={loading}
            onPress={loading ? undefined : handlePress}
        >
            <YStack alignItems="center" height="100%" justifyContent="center" gap={2}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M7.40018 6.32L15.8902 3.49C19.7002 2.22 21.7702 4.3 20.5102 8.11L17.6802 16.6C15.7802 22.31 12.6602 22.31 10.7602 16.6L9.92018 14.08L7.40018 13.24C1.69018 11.34 1.69018 8.23 7.40018 6.32Z"
                        stroke="#5E69FF"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <Path
                        d="M10.1099 13.65L13.6899 10.06"
                        stroke="#5E69FF"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </Svg>
                <Text color="#171717" fontSize={15} fontWeight={500}>
                    {loading ? 'Withdrawing' : error ? 'Error' : 'Withdraw'}
                </Text>
            </YStack>
        </Button>
    );
});
