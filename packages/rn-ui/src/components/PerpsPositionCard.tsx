import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

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
    return (
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path
                d="M4.45 9.96L7.89 6.52C8.21 6.2 8.21 5.68 7.89 5.36L4.45 1.92"
                stroke="#171717"
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
            backgroundColor="#E8E8E8"
            borderRadius={22}
            paddingVertical={8}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
            onPress={onPress}
        >
            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
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
    const pnlColor = position.pnlValue >= 0 ? '#429F37' : '#FF372B';
    const fundingColor = position.fundingValue >= 0 ? '#429F37' : '#FF372B';
    const directionVariant = position.direction === 'buy' ? 'buy' : 'sell';
    const directionLabel = position.direction === 'buy' ? 'Buy' : 'Sell';
    const hasTpSl = position.tpPrice !== '--' || position.slPrice !== '--';

    return (
        <YStack backgroundColor="#FFFFFF" borderWidth={1} borderColor="#F0F0F0" borderRadius={12} padding={12} gap={12}>
            {/* Header */}
            <YStack>
                {/* Symbol Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={4}>
                        <Text color="#171717" fontSize={14} lineHeight={14} fontWeight={600}>
                            {position.symbol}
                        </Text>
                        <ArrowRightIcon />
                    </XStack>
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
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
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                                Size({position.sizeUnit})
                            </Text>
                            <SwapIcon width={16} height={16} />
                        </XStack>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.sizeCoin}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                            Margin
                        </Text>
                        <XStack alignItems="center" gap={2}>
                            <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
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
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} textAlign="right">
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
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                            Entry Price
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.entryPrice}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                            Mark Price
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.markPrice}
                        </Text>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} textAlign="right">
                            Liq. Price
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.liqPrice}
                        </Text>
                    </YStack>
                </XStack>
            </YStack>

            {/* TP/SL */}
            <XStack alignItems="center" gap={4}>
                <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                    TP/SL
                </Text>
                {hasTpSl ? (
                    <Text fontSize={14} lineHeight={20} fontWeight={600}>
                        <Text color="#429F37">{position.tpPrice}</Text>
                        <Text color="#171717"> / </Text>
                        <Text color="#FF372B">{position.slPrice}</Text>
                    </Text>
                ) : (
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
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
