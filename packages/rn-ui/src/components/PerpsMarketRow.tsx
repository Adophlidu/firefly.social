import { memo } from 'react';
import { styled, Text, XStack, YStack } from 'tamagui';

import { CoinAvatar } from '@/components/CoinAvatar';
import { formatCoinName } from '@/helpers/formatCoinName';
import { nFormatter } from '@/helpers/nFormatter';
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
    backgroundColor: '$bgSubdued',
    alignItems: 'center',
    justifyContent: 'center',
});

export const PerpsMarketRow = memo<PerpsMarketRowProps>(function PerpsMarketRow({ item, onPress }) {
    const changeColor = (item.priceDiffRatio ?? 0) < 0 ? '$textCritical' : '$textSuccess';
    const coinName = formatCoinName(item.name);

    return (
        <RowButton onPress={() => onPress?.(item)}>
            <CoinAvatar name={item.name} />

            <YStack flex={1} gap={2} minWidth={0}>
                <XStack gap={4} alignItems="center">
                    <Text color="$text" fontSize={14} lineHeight={14} fontWeight={600}>
                        {coinName}
                    </Text>

                    <LeverageBadge>
                        <Text color="$textTertiary" fontSize={12} lineHeight={14} fontWeight={500}>
                            {item.maxLeverage}x
                        </Text>
                    </LeverageBadge>
                </XStack>

                <Text color="$textDisabled" fontSize={12} lineHeight={14} fontWeight={500}>
                    {item.dayNtlVlm ? `$${nFormatter(parseFloat(item.dayNtlVlm))}` : '-'} Vol
                </Text>
            </YStack>

            <YStack alignItems="flex-end" gap={2} minWidth={96}>
                <Text color="$text" fontSize={14} lineHeight={14} fontWeight={600}>
                    {item.mid ? `$${item.mid}` : '-'}
                </Text>

                {item.priceDiffRatio ? (
                    <Text color={changeColor} fontSize={12} lineHeight={14} fontWeight={500}>
                        {item.priceDiffRatio.toFixed(2)}%
                    </Text>
                ) : null}
            </YStack>
        </RowButton>
    );
});
