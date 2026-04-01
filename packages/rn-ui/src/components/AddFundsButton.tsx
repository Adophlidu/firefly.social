import { memo } from 'react';
import { Button, Text, YStack } from 'tamagui';

import { useAsyncFn } from '@/hooks/useAsyncFn';

interface AddFundsButtonProps {
    onPress?: () => Promise<string>;
}

export const AddFundsButton = memo<AddFundsButtonProps>(function AddFundsButton({ onPress }) {
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
                <Text color="#171717" fontSize={15} fontWeight={500}>
                    {loading ? 'Adding' : error ? 'Error' : 'Add Funds'}
                </Text>
            </YStack>
        </Button>
    );
});
