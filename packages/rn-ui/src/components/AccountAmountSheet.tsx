import { memo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { AccountAmountSheetSkeleton } from '@/skeletons/AccountAmountSheetSkeleton';
import type { AccountAmountActionType, AccountAmountSheetData } from '@/types/ui';

interface AccountAmountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: AccountAmountSheetData;
    loading?: boolean;
    onAction?: (action: AccountAmountActionType) => void | Promise<void>;
}

function ArrowUpIcon() {
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M10 16V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M13.5 7.5L10 4L6.5 7.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ArrowDownIcon() {
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M10 4V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M6.5 12.5L10 16L13.5 12.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ActionButton({
    label,
    action,
    onPress,
}: {
    label: string;
    action: AccountAmountActionType;
    onPress: (action: AccountAmountActionType) => void;
}) {
    return (
        <Button
            unstyled
            flex={1}
            minHeight={44}
            backgroundColor="#171717"
            borderRadius={22}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.9 }}
            onPress={() => onPress(action)}
        >
            <XStack alignItems="center" gap={6}>
                {action === 'withdraw' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                <Text color="#FFFFFF" fontSize={14} lineHeight={18} fontWeight={500}>
                    {label}
                </Text>
            </XStack>
        </Button>
    );
}

export const AccountAmountSheet = memo<AccountAmountSheetProps>(function AccountAmountSheet({
    open,
    onOpenChange,
    data,
    loading = false,
    onAction,
}) {
    const [position, setPosition] = useState(0);

    const handleAction = async (action: AccountAmountActionType) => {
        await onAction?.(action);
        onOpenChange(false);
    };

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
                minHeight={250}
            >
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                {loading ? (
                    <AccountAmountSheetSkeleton />
                ) : (
                    <YStack width="100%" gap={32}>
                        <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                            <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                                {data.title}
                            </Text>
                            <YStack width={24} height={24} />
                        </XStack>

                        <YStack width="100%" alignItems="center" gap={4}>
                            <XStack alignItems="flex-end" gap={4}>
                                <Text color="#B0B7BF" fontSize={48} lineHeight={56} fontWeight={400}>
                                    $
                                </Text>
                                <XStack alignItems="flex-end" gap={0}>
                                    <Text color="#070809" fontSize={48} lineHeight={56} fontWeight={700}>
                                        {data.totalBalanceWhole}
                                    </Text>
                                    <Text color="#070809" fontSize={24} lineHeight={32} fontWeight={600}>
                                        {data.totalBalanceFraction}
                                    </Text>
                                </XStack>
                            </XStack>

                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={400}>
                                {data.availableLabel}
                            </Text>
                        </YStack>

                        <XStack width="100%" alignItems="center" justifyContent="center" gap={16}>
                            {data.actions.map((item) => (
                                <ActionButton
                                    key={item.type}
                                    action={item.type}
                                    label={item.label}
                                    onPress={handleAction}
                                />
                            ))}
                        </XStack>
                    </YStack>
                )}
            </Sheet.Frame>
        </Sheet>
    );
});
