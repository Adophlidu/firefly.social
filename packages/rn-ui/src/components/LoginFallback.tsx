import { Text, YStack } from 'tamagui';

export function LoginFallback() {
    return (
        <YStack fullscreen alignItems="center" justifyContent="center">
            <Text>Please log in to view this content.</Text>
        </YStack>
    );
}
