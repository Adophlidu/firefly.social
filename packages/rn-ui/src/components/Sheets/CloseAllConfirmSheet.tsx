import { memo, useState } from 'react';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

interface CloseAllConfirmSheetProps {
    type: 'position' | 'order';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm?: () => void;
}

export const CloseAllConfirmSheet = memo<CloseAllConfirmSheetProps>(function CloseAllConfirmSheet({
    open,
    type,
    onOpenChange,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);

    const isPosition = type === 'position';

    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onOpenChange}
            snapPointsMode="fit"
            dismissOnSnapToBottom
            position={position}
            onPositionChange={setPosition}
            zIndex={100_000}
        >
            <Sheet.Overlay
                animation="quick"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                opacity={0.16}
                backgroundColor="#000000"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="rgba(34, 33, 47, 0.03)"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="#403D57"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
            >
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                <YStack width="100%">
                    <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                        <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            {isPosition ? 'Cancel all positions' : 'Cancel all orders'}
                        </Text>
                        <YStack width={24} height={24} />
                    </XStack>
                </YStack>

                <YStack>
                    {isPosition ? (
                        <>
                            <Text fontSize={13} fontWeight={500} color="rgba(70, 70, 70, 0.80)">
                                Your positions will all be closed at market price, and any open orders (or reduce-only
                                orders) will be canceled.
                            </Text>
                            <Text fontSize={13} fontWeight={500} color="rgba(70, 70, 70, 0.80)">
                                Options won't be affected.
                            </Text>
                        </>
                    ) : (
                        <Text fontSize={13} fontWeight={500} color="rgba(70, 70, 70, 0.80)">
                            This will cancel all your open orders, including take-profit and stop-loss orders.
                        </Text>
                    )}
                </YStack>
                <XStack gap={16} width="100%">
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        borderWidth={1}
                        borderColor="#171717"
                        justifyContent="center"
                        onPress={() => onOpenChange(false)}
                    >
                        <Text fontSize={16} fontWeight={700} color="#171717">
                            Back
                        </Text>
                    </Button>
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        backgroundColor="#171717"
                        justifyContent="center"
                        onPress={() => {
                            onConfirm?.();
                            onOpenChange(false);
                        }}
                    >
                        <Text fontSize={16} fontWeight={700} color="#E8E8E8">
                            Confirm
                        </Text>
                    </Button>
                </XStack>
            </Sheet.Frame>
        </Sheet>
    );
});
