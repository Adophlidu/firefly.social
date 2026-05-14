import { memo, useState } from 'react';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';

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
                backgroundColor="$text"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="$bgHover"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="$text"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
            >
                <SheetDragHandle />

                <YStack width="100%">
                    <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                        <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            {isPosition ? 'Cancel all positions' : 'Cancel all orders'}
                        </Text>
                        <YStack width={24} height={24} />
                    </XStack>
                </YStack>

                <YStack>
                    {isPosition ? (
                        <>
                            <Text fontSize={13} fontWeight={500} color="$textSubdued">
                                Your positions will all be closed at market price, and any open orders (or reduce-only
                                orders) will be canceled.
                            </Text>
                            <Text fontSize={13} fontWeight={500} color="$textSubdued">
                                Options won't be affected.
                            </Text>
                        </>
                    ) : (
                        <Text fontSize={13} fontWeight={500} color="$textSubdued">
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
                        flexDirection="row"
                        borderWidth={1}
                        borderColor="$text"
                        justifyContent="center"
                        onPress={() => onOpenChange(false)}
                    >
                        <Text fontSize={16} fontWeight={700} color="$text">
                            Back
                        </Text>
                    </Button>
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        flexDirection="row"
                        backgroundColor="$text"
                        justifyContent="center"
                        onPress={() => {
                            onConfirm?.();
                            onOpenChange(false);
                        }}
                    >
                        <Text fontSize={16} fontWeight={700} color="$bgHover">
                            Confirm
                        </Text>
                    </Button>
                </XStack>
            </Sheet.Frame>
        </Sheet>
    );
});
