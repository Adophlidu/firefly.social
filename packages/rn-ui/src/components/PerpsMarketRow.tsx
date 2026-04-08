import { memo } from 'react';
import { Avatar, styled, Text, XStack, YStack } from 'tamagui';

import type { PerpsMeta } from '@/types/ui';

export interface PerpsMarketRowProps {
    item: PerpsMeta;
    onPress?: (item: PerpsMeta) => void;
}

const RowButton = styled(XStack, {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    pressStyle: {
        opacity: 0.72,
    },
});

const LeverageBadge = styled(XStack, {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#EFEFF3',
    alignItems: 'center',
    justifyContent: 'center',
});

export const PerpsMarketRow = memo<PerpsMarketRowProps>(function PerpsMarketRow({ item, onPress }) {
    // const changeColor = (item.priceChangeValue ?? 0) < 0 ? '#FF372B' : '#429F37';

    return (
        <RowButton onPress={() => onPress?.(item)}>
            <Avatar circular size={36} flexShrink={0}>
                <Avatar.Image src={item.avatar} />
                <Avatar.Fallback delayMs={600} backgroundColor="#FF9800" alignItems="center" justifyContent="center">
                    <Text color="#FFFFFF" fontSize={16} lineHeight={18} fontWeight={700}>
                        {item.name.slice(0, 1)}
                    </Text>
                </Avatar.Fallback>
            </Avatar>

            <YStack flex={1} gap={2} minWidth={0}>
                <XStack gap={4} alignItems="center">
                    <Text color="#171717" fontSize={14} lineHeight={14} fontWeight={600}>
                        {item.name}
                    </Text>

                    <LeverageBadge>
                        <Text color="#A9A6BC" fontSize={12} lineHeight={14} fontWeight={500}>
                            {item.maxLeverage}x
                        </Text>
                    </LeverageBadge>
                </XStack>

                <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                    $4.9B Vol
                </Text>
            </YStack>

            <YStack alignItems="flex-end" gap={2} minWidth={96}>
                <Text color="#171717" fontSize={14} lineHeight={14} fontWeight={600}>
                    {item.mid ? `$${item.mid}` : '-'}
                </Text>

                {/* <Text color={changeColor} fontSize={12} lineHeight={14} fontWeight={500}>
                </Text> */}
            </YStack>
        </RowButton>
    );
});
