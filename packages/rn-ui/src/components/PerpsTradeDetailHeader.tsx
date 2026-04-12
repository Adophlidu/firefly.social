import { memo, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { TagBadge } from '@/../../../packages/rn-ui/src/components/TagBadge';
import { AccountAmountSheet } from '@/components/AccountAmountSheet';
import { BackIcon } from '@/icons/BackIcon';
import { ChartIcon } from '@/icons/ChartIcon';
import { ChevronDownIcon } from '@/icons/ChevronDownIcon';
import type { AccountAmountActionType, AccountAmountSheetData, PerpsTradeDetailTicker } from '@/types/ui';

interface PerpsTradeDetailHeaderProps {
    available: string;
    ticker: PerpsTradeDetailTicker;
    title?: string;
    onBack?: () => void;
    onSettingsPress?: () => void;
    onAccountAmountAction?: (actionType: AccountAmountActionType) => void;
}

const defaultAccountAmountData: AccountAmountSheetData = {
    title: 'Portfolio',
    totalBalanceWhole: '2,900',
    totalBalanceFraction: '.45',
    availableLabel: 'Available: $742.86',
    actions: [
        { type: 'withdraw', label: 'Withdraw' },
        { type: 'addFunds', label: 'Add Funds' },
    ],
};

export const PerpsTradeDetailHeader = memo<PerpsTradeDetailHeaderProps>(function PerpsTradeDetailHeader({
    available,
    ticker,
    title = 'Perps',
    onBack,
    onSettingsPress,
    onAccountAmountAction,
}) {
    const [accountAmountSheetOpen, setAccountAmountSheetOpen] = useState(false);

    return (
        <YStack>
            <XStack height={44} alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
                <Button
                    unstyled
                    width={24}
                    height={24}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.72 }}
                    onPress={onBack}
                    icon={<BackIcon width={24} height={24} />}
                />

                <Text
                    color="#181818"
                    fontSize={18}
                    lineHeight={24}
                    fontWeight={600}
                    fontFamily="$body"
                    textAlign="center"
                >
                    {title}
                </Text>

                <Button
                    unstyled
                    backgroundColor="#F8F7F9"
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.03)"
                    borderRadius={16}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    alignItems="center"
                    gap={6}
                    pressStyle={{ opacity: 0.75 }}
                    onPress={() => {
                        setAccountAmountSheetOpen(true);
                    }}
                >
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                        {available}
                    </Text>
                </Button>
            </XStack>

            <YStack paddingHorizontal={12} paddingVertical={8} gap={8}>
                <XStack alignItems="center" justifyContent="space-between">
                    <YStack>
                        <XStack alignItems="center" gap={4}>
                            <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                                {ticker.symbol}
                            </Text>
                            <TagBadge label={ticker.leverage} />
                            <Button
                                unstyled
                                width={16}
                                height={16}
                                alignItems="center"
                                justifyContent="center"
                                pressStyle={{ opacity: 0.72 }}
                                onPress={onSettingsPress}
                                icon={<ChevronDownIcon />}
                            />
                        </XStack>
                        <XStack alignItems="center" gap={4}>
                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                {ticker.marketType}
                            </Text>
                            <Text color="#429F37" fontSize={12} lineHeight={14} fontWeight={500}>
                                {ticker.priceChangeLabel}
                            </Text>
                        </XStack>
                    </YStack>
                    <Button
                        unstyled
                        width={24}
                        height={24}
                        alignItems="center"
                        justifyContent="center"
                        pressStyle={{ opacity: 0.72 }}
                        onPress={onSettingsPress}
                        icon={<ChartIcon width={24} height={24} />}
                    />
                </XStack>
            </YStack>

            <AccountAmountSheet
                open={accountAmountSheetOpen}
                onOpenChange={setAccountAmountSheetOpen}
                data={defaultAccountAmountData}
                onAction={onAccountAmountAction}
            />
        </YStack>
    );
});
