import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { TagBadge } from '@/components/TagBadge';
import { EditIcon } from '@/icons/EditIcon';
import { SwapIcon } from '@/icons/SwapIcon';
import type { PerpsPositionItem } from '@/types/ui';

interface PerpsPositionCardProps {
    position: PerpsPositionItem;
    onClose?: (position: PerpsPositionItem) => void;
    onCloseAll?: () => void;
    onAddToPosition?: (position: PerpsPositionItem) => void;
    onTpSl?: (position: PerpsPositionItem) => void;
}

function ArrowRightIcon() {
    const theme = useTheme();
    return (
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path
                d="M4.45 9.96L7.89 6.52C8.21 6.2 8.21 5.68 7.89 5.36L4.45 1.92"
                stroke={theme.text!.get()}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ActionButton({ label, onPress }: { label: string; onPress?: () => void }) {
    return (
        <Button
            unstyled
            flex={1}
            backgroundColor="$bgHover"
            borderRadius={22}
            paddingVertical={8}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
            onPress={onPress}
        >
            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                {label}
            </Text>
        </Button>
    );
}

export const PerpsPositionCard = memo<PerpsPositionCardProps>(function PerpsPositionCard({
    position,
    onClose,
    onCloseAll,
    onAddToPosition,
    onTpSl,
}) {
    const pnlColor = position.pnlValue >= 0 ? '$textSuccess' : '$textCritical';
    const fundingColor = position.fundingValue >= 0 ? '$textSuccess' : '$textCritical';
    const directionVariant = position.direction === 'buy' ? 'buy' : 'sell';
    const directionLabel = position.direction === 'buy' ? 'Buy' : 'Sell';
    const hasTpSl = position.tpPrice !== '--' || position.slPrice !== '--';

    return (
        <YStack backgroundColor="$bg" borderWidth={1} borderColor="$border" borderRadius={12} padding={12} gap={12}>
            {/* Header */}
            <YStack>
                {/* Symbol Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={4}>
                        <Text color="$text" fontSize={14} lineHeight={14} fontWeight={600}>
                            {position.symbol}
                        </Text>
                        <ArrowRightIcon />
                    </XStack>
                    <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                        PnL(USDC)
                    </Text>
                </XStack>

                {/* Tags + PnL Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={4}>
                        <TagBadge label={directionLabel} variant={directionVariant} />
                        <TagBadge label={position.marginMode === 'isolated' ? 'Isolated' : 'Cross'} />
                        <TagBadge label={position.leverage} />
                    </XStack>
                    <Text color={pnlColor} fontSize={14} lineHeight={14} fontWeight={600}>
                        {position.pnl}({position.pnlPercent})
                    </Text>
                </XStack>
            </YStack>

            {/* Size / Margin / Funding */}
            <YStack>
                <XStack gap={8} alignItems="center">
                    <YStack flex={1}>
                        <XStack alignItems="flex-start">
                            <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                                Size({position.sizeUnit})
                            </Text>
                            <SwapIcon width={16} height={16} />
                        </XStack>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.sizeCoin}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            Margin
                        </Text>
                        <XStack alignItems="center" gap={2}>
                            <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                                {position.margin}
                            </Text>
                            <Button
                                unstyled
                                width={16}
                                height={16}
                                alignItems="center"
                                justifyContent="center"
                                pressStyle={{ opacity: 0.72 }}
                                onPress={() => onAddToPosition?.(position)}
                                icon={<EditIcon width={16} height={16} />}
                            />
                        </XStack>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="$textDisabled" fontSize={12} lineHeight={14} textAlign="right">
                            Funding
                        </Text>
                        <Text color={fundingColor} fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.funding}
                        </Text>
                    </YStack>
                </XStack>
            </YStack>

            {/* Entry / Mark / Liq Price */}
            <YStack>
                <XStack gap={8} alignItems="center">
                    <YStack flex={1}>
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            Entry Price
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.entryPrice}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            Mark Price
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.markPrice}
                        </Text>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="$textDisabled" fontSize={12} lineHeight={14} textAlign="right">
                            Liq. Price
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.liqPrice}
                        </Text>
                    </YStack>
                </XStack>
            </YStack>

            {/* TP/SL */}
            <XStack alignItems="center" gap={4}>
                <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                    TP/SL
                </Text>
                {hasTpSl ? (
                    <Text fontSize={14} lineHeight={20} fontWeight={600}>
                        <Text color="$textSuccess">{position.tpPrice}</Text>
                        <Text color="$text"> / </Text>
                        <Text color="$textCritical">{position.slPrice}</Text>
                    </Text>
                ) : (
                    <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                        --/--
                    </Text>
                )}
            </XStack>

            {/* Action Buttons */}
            <XStack gap={12} alignItems="center" justifyContent="center">
                <ActionButton label="TP/SL" onPress={() => onTpSl?.(position)} />
                <ActionButton label="Close" onPress={() => onClose?.(position)} />
                <ActionButton label="Close all" onPress={onCloseAll} />
            </XStack>
        </YStack>
    );
});
