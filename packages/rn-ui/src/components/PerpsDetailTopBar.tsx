import { memo } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookmarkButton } from '@/components/BookmarkButton';
import { formatCoinName } from '@/helpers/formatCoinName';
import { navigate } from '@/helpers/navigate';
import { BackIcon } from '@/icons/BackIcon';
import { ChevronDownIcon } from '@/icons/ChevronDownIcon';

interface PerpsDetailTopBarProps {
    symbol: string;
    leverage: string;
    marketType: string;
    onOpenSelector: () => void;
}

export const PerpsDetailTopBar = memo<PerpsDetailTopBarProps>(function PerpsDetailTopBar({
    symbol,
    leverage,
    marketType,
    onOpenSelector,
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
                onPress={() => navigate('__parent__', {})}
            />

            <YStack flex={1} minWidth={0} alignItems="flex-start" justifyContent="center" gap={0} paddingTop={1}>
                <Button unstyled onPress={onOpenSelector}>
                    <XStack alignItems="center" gap={4}>
                        <Text color="#171717" fontSize={18} lineHeight={22} fontWeight={600}>
                            {formatCoinName(symbol)}
                        </Text>

                        <YStack backgroundColor="#EFEFF3" borderRadius={999} paddingHorizontal={6} paddingVertical={1}>
                            <Text color="#A9A6BC" fontSize={12} lineHeight={14} fontWeight={500}>
                                {leverage}x
                            </Text>
                        </YStack>

                        <ChevronDownIcon stroke="#171717" />
                    </XStack>
                </Button>

                <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                    {marketType}
                </Text>
            </YStack>

            <BookmarkButton coinName={symbol} />
        </XStack>
    );
});
