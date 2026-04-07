import { memo, useMemo, useState } from 'react';
import { Button, Text, XStack, YStack, type YStackProps } from 'tamagui';

import { type TradesHistoryTab } from '@/types/ui';
import { AccountHistory, type AccountHistoryProps } from '@/ui/Perps/AccountHistory';
import { TradingHistory, type TradingHistoryProps } from '@/ui/Perps/TradingHistory';

interface TradesHistoryProps extends Omit<YStackProps, 'children'> {
    walletAddress: string;
    defaultTab?: TradesHistoryTab;
    tradingPageSize?: number;
    accountPageSize?: number;
    fetchTradingHistory?: TradingHistoryProps['fetchTradingHistory'];
    fetchAccountHistory?: AccountHistoryProps['fetchAccountHistory'];
    onTabChange?: (tab: TradesHistoryTab) => void;
}

export const TradesHistory = memo<TradesHistoryProps>(function TradesHistory({
    walletAddress,
    defaultTab = 'trading',
    tradingPageSize,
    accountPageSize,
    fetchTradingHistory,
    fetchAccountHistory,
    onTabChange,
    ...rest
}) {
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
            <XStack justifyContent="center" paddingVertical={4}>
                <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={600}>
                    My trades
                </Text>
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

            <YStack flex={1} minHeight={0}>
                {tab === 'trading' ? (
                    <YStack flex={1} minHeight={0}>
                        <TradingHistory
                            walletAddress={walletAddress}
                            pageSize={tradingPageSize}
                            fetchTradingHistory={fetchTradingHistory}
                        />
                    </YStack>
                ) : null}

                {accountVisited ? (
                    <YStack display={tab === 'account' ? 'flex' : 'none'} flex={1} minHeight={0}>
                        <YStack flex={1} minHeight={0}>
                            <AccountHistory
                                walletAddress={walletAddress}
                                pageSize={accountPageSize}
                                fetchAccountHistory={fetchAccountHistory}
                            />
                        </YStack>
                    </YStack>
                ) : null}
            </YStack>
        </YStack>
    );
});

export type {
    AccountHistoryPageResponse as AccountHistoryPage,
    FetchAccountHistory,
    FetchTradingHistory,
    TradingHistoryPageResponse as TradingHistoryPage,
} from '@/types/services';
export type { AccountHistoryItem, TradesHistoryTab, TradingHistoryItem } from '@/types/ui';
