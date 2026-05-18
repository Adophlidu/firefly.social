import { Trans, useLingui } from '@lingui/react/macro';
import { memo } from 'react';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { useAccountHistory } from '@/hooks/Perps/useAccountHistory';
import { AccountHistorySkeleton } from '@/skeletons/AccountHistorySkeleton';
import type { AccountHistoryItem } from '@/types/ui';

export interface AccountHistoryProps {
    walletAddress: string;
}

interface AccountHistoryItemCardProps {
    item: AccountHistoryItem;
}

const AccountHistoryItemCard = memo<AccountHistoryItemCardProps>(function AccountHistoryItemCard({ item }) {
    const positive = item.amount.startsWith('+');

    return (
        <XStack
            backgroundColor="$bg"
            borderWidth={1}
            borderColor="$border"
            borderRadius={12}
            padding={12}
            alignItems="center"
            gap={8}
        >
            <YStack
                width={40}
                height={40}
                borderRadius={20}
                backgroundColor="$bgSubdued"
                justifyContent="center"
                alignItems="center"
            >
                <Text
                    color={positive ? '$textSuccess' : '$textCritical'}
                    fontSize={16}
                    lineHeight={20}
                    fontWeight={600}
                >
                    {positive ? '↓' : '↑'}
                </Text>
            </YStack>

            <YStack flex={1} gap={2}>
                <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                    {item.title}
                </Text>
                <Text color="$textSubdued" fontSize={12} lineHeight={14}>
                    {item.timeAgo}
                </Text>
            </YStack>

            <Text color={positive ? '$textSuccess' : '$textCritical'} fontSize={14} lineHeight={20} fontWeight={600}>
                {item.amount}
            </Text>
        </XStack>
    );
});

export const AccountHistory = memo<AccountHistoryProps>(function AccountHistory({ walletAddress }) {
    const { i18n } = useLingui();
    const {
        data: items,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useAccountHistory({
        walletAddress,
    });

    if (!walletAddress) {
        return (
            <XStack justifyContent="center" paddingVertical={20}>
                <Text color="$textSubdued" fontSize={12} lineHeight={14}>
                    <Trans id="rn-ui.accountHistory.noWallet">Wallet: --</Trans>
                </Text>
            </XStack>
        );
    }

    if (isLoading) {
        return <AccountHistorySkeleton />;
    }
    if (error && !items?.length) {
        return (
            <YStack alignItems="center" justifyContent="center" gap={8} paddingVertical={20}>
                <Text color="$textCritical" fontSize={12} lineHeight={14}>
                    <Trans id="rn-ui.accountHistory.loadFailed">Failed to load account history</Trans>
                </Text>
                <Button
                    unstyled
                    backgroundColor="$bgSubdued"
                    borderWidth={1}
                    borderColor="$border"
                    borderRadius={8}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    pressStyle={{ opacity: 0.75 }}
                    onPress={() => {
                        void refetch();
                    }}
                >
                    <Text color="$text" fontSize={12} lineHeight={14} fontWeight={600}>
                        {isRefetching ? i18n._('rn-ui.action.retrying') : i18n._('rn-ui.action.retry')}
                    </Text>
                </Button>
            </YStack>
        );
    }
    if (!items?.length) {
        return <NoDataFallback />;
    }

    return (
        <ScrollView flex={1} minHeight={0} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
            <YStack gap={12} paddingBottom={16}>
                {items.map((item) => (
                    <AccountHistoryItemCard key={item.id} item={item} />
                ))}

                {error ? (
                    <YStack alignItems="center" gap={8} paddingTop={4}>
                        <Text color="$textCritical" fontSize={12} lineHeight={14}>
                            <Trans id="rn-ui.accountHistory.refreshFailed">Failed to refresh account history</Trans>
                        </Text>
                        <Button
                            unstyled
                            backgroundColor="$bgSubdued"
                            borderWidth={1}
                            borderColor="$border"
                            borderRadius={8}
                            paddingHorizontal={12}
                            paddingVertical={6}
                            pressStyle={{ opacity: 0.75 }}
                            onPress={() => {
                                void refetch();
                            }}
                        >
                            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={600}>
                                {isRefetching ? i18n._('rn-ui.action.retrying') : i18n._('rn-ui.action.retry')}
                            </Text>
                        </Button>
                    </YStack>
                ) : null}
            </YStack>
        </ScrollView>
    );
});
