import { Trans, useLingui } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, useTheme, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { formatUSDC } from '@/helpers/formatUSDC';
import { navigate } from '@/helpers/navigate';
import { usePerpsComputedAccountValue } from '@/hooks/Perps/usePerpsComputedAccountValue';
import { AccountAmountSheetSkeleton } from '@/skeletons/AccountAmountSheetSkeleton';

interface AccountAmountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading?: boolean;
}

function ArrowUpIcon() {
    const theme = useTheme();
    const stroke = theme.bg?.get() || 'white';

    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M10 16V4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M13.5 7.5L10 4L6.5 7.5"
                stroke={stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ArrowDownIcon() {
    const theme = useTheme();
    const stroke = theme.bg?.get() || 'white';

    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M10 4V16" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M6.5 12.5L10 16L13.5 12.5"
                stroke={stroke}
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
    action: 'withdraw' | 'addFunds';
    onPress: (action: 'withdraw' | 'addFunds') => void;
}) {
    return (
        <Button
            unstyled
            flex={1}
            minHeight={44}
            backgroundColor="$text"
            borderRadius={22}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.9 }}
            onPress={() => onPress(action)}
        >
            <XStack alignItems="center" gap={6}>
                {action === 'withdraw' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                <Text color="$bg" fontSize={14} lineHeight={18} fontWeight={500}>
                    {label}
                </Text>
            </XStack>
        </Button>
    );
}

export const AccountAmountSheet = memo<AccountAmountSheetProps>(function AccountAmountSheet({
    open,
    onOpenChange,
    loading = false,
}) {
    const { i18n } = useLingui();
    const [position, setPosition] = useState(0);
    const { accountValue, withdrawable, isLoading, error, refetch } = usePerpsComputedAccountValue();

    const portfolioDisplay = formatUSDC(accountValue ?? 0);
    const [portfolioIntegerPart, portfolioDecimalPart] = portfolioDisplay.replace('$', '').split('.');
    const availableDisplay = formatUSDC(withdrawable ?? 0);

    const handleAction = async (action: 'withdraw' | 'addFunds') => {
        onOpenChange(false);
        navigate(action, {});
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
                minHeight={250}
            >
                <SheetDragHandle />

                {loading || isLoading ? (
                    <AccountAmountSheetSkeleton />
                ) : (
                    <YStack width="100%" gap={32}>
                        <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                            <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                                <Trans id="rn-ui.accountAmount.portfolio">Portfolio</Trans>
                            </Text>
                            <YStack width={24} height={24} />
                        </XStack>

                        <YStack width="100%" alignItems="center" gap={4}>
                            <XStack alignItems="flex-end" gap={4}>
                                <Text color="$textTertiary" fontSize={48} lineHeight={56} fontWeight={400}>
                                    $
                                </Text>
                                <XStack alignItems="flex-end" gap={0}>
                                    <Text color="$text" fontSize={48} lineHeight={56} fontWeight={700}>
                                        {portfolioIntegerPart || '0'}
                                    </Text>
                                    <Text color="$text" fontSize={24} lineHeight={32} fontWeight={600}>
                                        .{portfolioDecimalPart || '00'}
                                    </Text>
                                </XStack>
                            </XStack>

                            <Text color="$textSubdued" fontSize={13} lineHeight={17} fontWeight={400}>
                                <Trans id="rn-ui.accountAmount.available">Available: {availableDisplay}</Trans>
                            </Text>
                        </YStack>

                        {error ? (
                            <YStack width="100%" alignItems="center" gap={8} marginTop={-16}>
                                <Text color="$textCritical" fontSize={12} lineHeight={14}>
                                    Failed to load account value
                                </Text>
                                <Button
                                    unstyled
                                    borderWidth={1}
                                    borderColor="$border"
                                    borderRadius={8}
                                    paddingHorizontal={12}
                                    paddingVertical={6}
                                    pressStyle={{ opacity: 0.72 }}
                                    onPress={() => {
                                        void refetch();
                                    }}
                                >
                                    <Text color="$text" fontSize={12} lineHeight={14} fontWeight={600}>
                                        <Trans id="rn-ui.action.retry">Retry</Trans>
                                    </Text>
                                </Button>
                            </YStack>
                        ) : null}

                        <XStack width="100%" alignItems="center" justifyContent="center" gap={16}>
                            <ActionButton
                                action="withdraw"
                                label={i18n._('rn-ui.accountAmount.withdraw')}
                                onPress={handleAction}
                            />
                            <ActionButton
                                action="addFunds"
                                label={i18n._('rn-ui.accountAmount.addFunds')}
                                onPress={handleAction}
                            />
                        </XStack>
                    </YStack>
                )}
            </Sheet.Frame>
        </Sheet>
    );
});
