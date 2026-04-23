import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack } from 'tamagui';

import { navigate } from '@/helpers/navigate';

export type PerpsTradeDetailTab = 'positions' | 'orders';

interface PerpsTradeDetailTabsProps {
    activeTab: PerpsTradeDetailTab;
    positionsCount: number;
    ordersCount: number;
    onTabChange: (tab: PerpsTradeDetailTab) => void;
}

function CalendarIcon() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M8 2V5" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 2V5" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.5 9.09H20.5" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                stroke="#171717"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export const PerpsTradeDetailTabs = memo<PerpsTradeDetailTabsProps>(function PerpsTradeDetailTabs({
    activeTab,
    positionsCount,
    ordersCount,
    onTabChange,
}) {
    return (
        <XStack alignItems="center" justifyContent="space-between">
            <XStack gap={16} alignItems="center">
                <Button
                    unstyled
                    height={36}
                    alignItems="center"
                    justifyContent="center"
                    borderBottomWidth={activeTab === 'positions' ? 2.5 : 0}
                    borderBottomColor="#171717"
                    onPress={() => onTabChange('positions')}
                    pressStyle={{ opacity: 0.75 }}
                >
                    <Text
                        color={activeTab === 'positions' ? '#171717' : 'rgba(70, 70, 70, 0.8)'}
                        fontSize={16}
                        lineHeight={24}
                        fontWeight={600}
                        fontFamily="$body"
                    >
                        Positions({positionsCount})
                    </Text>
                </Button>
                <Button
                    unstyled
                    height={36}
                    alignItems="center"
                    justifyContent="center"
                    paddingHorizontal={4}
                    borderBottomWidth={activeTab === 'orders' ? 2.5 : 0}
                    borderBottomColor="#171717"
                    onPress={() => onTabChange('orders')}
                    pressStyle={{ opacity: 0.75 }}
                >
                    <Text
                        color={activeTab === 'orders' ? '#171717' : 'rgba(70, 70, 70, 0.8)'}
                        fontSize={16}
                        lineHeight={24}
                        fontWeight={600}
                        fontFamily="$body"
                    >
                        Orders({ordersCount})
                    </Text>
                </Button>
            </XStack>

            <Button
                unstyled
                width={24}
                height={24}
                alignItems="center"
                justifyContent="center"
                pressStyle={{ opacity: 0.72 }}
                onPress={() => navigate('history', {})}
            >
                <CalendarIcon />
            </Button>
        </XStack>
    );
});
