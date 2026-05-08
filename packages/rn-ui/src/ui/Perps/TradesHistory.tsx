import { useAtomValue } from 'jotai';
import { memo, useMemo, useState } from 'react';
import { Button, Text, XStack, YStack, type YStackProps } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { navigate } from '@/helpers/navigate';
import { BackIcon } from '@/icons/BackIcon';
import { walletAddressAtom } from '@/store/wallet';
import type { TradesHistoryTab } from '@/types/ui';
import { AccountHistory } from '@/ui/Perps/AccountHistory';
import { TradingHistory } from '@/ui/Perps/TradingHistory';

interface TradesHistoryProps extends Omit<YStackProps, 'children'> {
    defaultTab?: TradesHistoryTab;
    onTabChange?: (tab: TradesHistoryTab) => void;
}

export const TradesHistory = memo<TradesHistoryProps>(function TradesHistory({
    defaultTab = 'trading',
    onTabChange,
    ...rest
}) {
    const walletAddress = useAtomValue(walletAddressAtom);
    const [tab, setTab] = useState<TradesHistoryTab>(defaultTab);
    const [accountVisited, setAccountVisited] = useState(defaultTab === 'account');

    const tabs = useMemo(
        () => [
            { value: 'trading' as const, label: 'Trading history' },
            { value: 'account' as const, label: 'Account history' },
        ],
        [],
    );

    return (
        <YStack
            height="100%"
            minHeight={0}
            backgroundColor="#FFFFFF"
            paddingHorizontal={12}
            paddingTop={10}
            gap={12}
            {...rest}
        >
            <XStack height={44} alignItems="center" justifyContent="space-between">
                <Button
                    unstyled
                    width={24}
                    height={24}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.72 }}
                    onPress={() => navigate('__parent__', {})}
                    icon={<BackIcon width={24} height={24} />}
                />
                <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={600}>
                    My trades
                </Text>
                <XStack width={24} height={24} />
            </XStack>

            <XStack paddingHorizontal={16} gap={16}>
                {tabs.map((item) => {
                    const active = tab === item.value;

                    return (
                        <Button
                            key={item.value}
                            unstyled
                            height={44}
                            borderBottomWidth={2.5}
                            borderBottomColor={active ? '#171717' : 'transparent'}
                            justifyContent="center"
                            alignItems="center"
                            onPress={() => {
                                setTab(item.value);
                                if (item.value === 'account') {
                                    setAccountVisited(true);
                                }
                                onTabChange?.(item.value);
                            }}
                        >
                            <Text color={active ? '#171717' : '#9EA1B0'} fontSize={16} lineHeight={24} fontWeight={600}>
                                {item.label}
                            </Text>
                        </Button>
                    );
                })}
            </XStack>

            {walletAddress ? (
                <YStack flex={1} minHeight={0}>
                    {tab === 'trading' ? (
                        <YStack flex={1} minHeight={0}>
                            <TradingHistory walletAddress={walletAddress} />
                        </YStack>
                    ) : null}

                    {accountVisited ? (
                        <YStack display={tab === 'account' ? 'flex' : 'none'} flex={1} minHeight={0}>
                            <YStack flex={1} minHeight={0}>
                                <AccountHistory walletAddress={walletAddress} />
                            </YStack>
                        </YStack>
                    ) : null}
                </YStack>
            ) : (
                <YStack>
                    <NoDataFallback />
                </YStack>
            )}
        </YStack>
    );
});
