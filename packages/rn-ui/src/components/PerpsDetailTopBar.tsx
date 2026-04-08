import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BackIcon } from '@/icons/BackIcon';

interface PerpsDetailTopBarProps {
    symbol: string;
    leverage: string;
    marketType: string;
    onBack?: () => void;
}

function StarOutlineIcon() {
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
                d="M10 2.2L12.4 7.05L17.75 7.83L13.88 11.6L14.79 16.92L10 14.4L5.21 16.92L6.12 11.6L2.25 7.83L7.6 7.05L10 2.2Z"
                stroke="#171717"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ChevronDownIcon() {
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <Path
                d="M3.10343 5.84506L6.1251 8.86673C6.60926 9.3509 7.39676 9.3509 7.88093 8.86673L10.9026 5.84506"
                stroke="#171717"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export const PerpsDetailTopBar = memo<PerpsDetailTopBarProps>(function PerpsDetailTopBar({
    symbol,
    leverage,
    marketType,
    onBack,
}) {
    return (
        <XStack height={48} alignItems="flex-start" justifyContent="space-between" paddingHorizontal={8} paddingTop={2}>
            <Button
                unstyled
                width={30}
                height={30}
                alignItems="center"
                justifyContent="center"
                borderRadius={15}
                pressStyle={{ opacity: 0.72 }}
                icon={<BackIcon width={20} height={20} />}
                onPress={onBack}
            />

            <YStack flex={1} minWidth={0} alignItems="flex-start" justifyContent="center" gap={0} paddingTop={1}>
                <XStack alignItems="center" gap={4}>
                    <Text color="#171717" fontSize={18} lineHeight={22} fontWeight={600}>
                        {symbol}
                    </Text>

                    <YStack backgroundColor="#EFEFF3" borderRadius={999} paddingHorizontal={6} paddingVertical={1}>
                        <Text color="#A9A6BC" fontSize={12} lineHeight={14} fontWeight={500}>
                            {leverage}
                        </Text>
                    </YStack>

                    <YStack marginTop={1}>
                        <ChevronDownIcon />
                    </YStack>
                </XStack>

                <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                    {marketType}
                </Text>
            </YStack>

            <Button
                unstyled
                width={30}
                height={30}
                alignItems="center"
                justifyContent="center"
                borderRadius={15}
                pressStyle={{ opacity: 0.72 }}
            >
                <StarOutlineIcon />
            </Button>
        </XStack>
    );
});
