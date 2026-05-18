import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, useTheme, XStack } from 'tamagui';

import { navigate } from '@/helpers/navigate';

export type PerpsTradeDetailTab = 'positions' | 'orders';

interface PerpsTradeDetailTabsProps {
    activeTab: PerpsTradeDetailTab;
    positionsCount: number;
    ordersCount: number;
    onTabChange: (tab: PerpsTradeDetailTab) => void;
}

function CalendarIcon() {
    const theme = useTheme();
    const stroke = theme.text!.get();
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M8 2V5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 2V5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3.5 9.09H20.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                stroke={stroke}
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
                    borderBottomColor="$text"
                    onPress={() => onTabChange('positions')}
                    pressStyle={{ opacity: 0.75 }}
                >
                    <Text
                        color={activeTab === 'positions' ? '$text' : '$textSubdued'}
                        fontSize={16}
                        lineHeight={24}
                        fontWeight={600}
                        fontFamily="$body"
                    >
                        <Trans id="rn-ui.trade-detail.positions">Positions({positionsCount})</Trans>
                    </Text>
                </Button>
                <Button
                    unstyled
                    height={36}
                    alignItems="center"
                    justifyContent="center"
                    paddingHorizontal={4}
                    borderBottomWidth={activeTab === 'orders' ? 2.5 : 0}
                    borderBottomColor="$text"
                    onPress={() => onTabChange('orders')}
                    pressStyle={{ opacity: 0.75 }}
                >
                    <Text
                        color={activeTab === 'orders' ? '$text' : '$textSubdued'}
                        fontSize={16}
                        lineHeight={24}
                        fontWeight={600}
                        fontFamily="$body"
                    >
                        <Trans id="rn-ui.trade-detail.orders">Orders({ordersCount})</Trans>
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
