import { memo, useMemo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { TagBadge } from '@/components/TagBadge';
import { formatAmount } from '@/helpers/formatAmount';
import { formatCoinName } from '@/helpers/formatCoinName';
import { formatUSDC } from '@/helpers/formatUSDC';
import { dividedBy, isGreaterThan, isZero, multipliedBy } from '@/helpers/number';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { EditIcon } from '@/icons/EditIcon';
import { SwapIcon } from '@/icons/SwapIcon';
import type { Position } from '@/types/ui';

import { ButtonUI } from '../ButtonUI';

interface PerpsPositionCardProps {
    position: Position;
    disabled?: boolean;
    onLimitClose?: (position: Position) => void;
    onMarketClose?: (position: Position) => void;
    onAddToPosition?: (position: Position) => void;
    onTpSl?: (position: Position) => void;
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

function ActionButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress?: () => void }) {
    return (
        <ButtonUI
            unstyled
            flex={1}
            backgroundColor="#E8E8E8"
            borderRadius={22}
            paddingVertical={8}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
            disabled={disabled}
            onPress={onPress}
        >
            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                {label}
            </Text>
        </ButtonUI>
    );
}

export const PerpsPositionCard = memo<PerpsPositionCardProps>(function PerpsPositionCard({
    position,
    disabled,
    onLimitClose,
    onMarketClose,
    onAddToPosition,
    onTpSl,
}) {
    const { data: coinInfo } = useCoinInfo(position.coin);

    const marketPrice = coinInfo?.assetCtx?.markPx;

    const pnlColor = isGreaterThan(position.unrealizedPnl, 0) ? '#429F37' : '#FF372B';
    const fundingColor = isGreaterThan(position.cumFunding.sinceOpen, 0) ? '#429F37' : '#FF372B';
    const isBuy = isGreaterThan(position.szi, '0');
    const directionVariant = isBuy ? 'buy' : 'sell';
    const directionLabel = isBuy ? 'Buy' : 'Sell';
    const hasTpSl = true;

    const { winRatio, winUsdc } = useMemo(() => {
        if (isZero(position.unrealizedPnl)) return { winRatio: 0, winUsdc: 0 };

        const cost = multipliedBy(position.entryPx, position.szi).dividedBy(position.leverage.value);
        if (cost.isNaN() || !cost.isFinite() || cost.isZero()) return { winRatio: 0, winUsdc: 0 };
        const ratio = dividedBy(position.unrealizedPnl, cost)
            .multipliedBy(!isBuy ? -100 : 100)
            .toFormat(1);
        const symbol = isGreaterThan(position.unrealizedPnl, 0) ? '+' : '';

        return { winRatio: `${symbol}${ratio}%`, winUsdc: `${symbol}${formatUSDC(position.unrealizedPnl)}` };
    }, [position, isBuy]);

    return (
        <YStack backgroundColor="#FFFFFF" borderWidth={1} borderColor="#F0F0F0" borderRadius={12} padding={12} gap={12}>
            {/* Header */}
            <YStack gap={4}>
                {/* Symbol Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={4}>
                        <Text color="#171717" fontSize={14} lineHeight={14} fontWeight={600}>
                            {formatCoinName(position.coin)}
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
                        <TagBadge label={position.leverage.type === 'cross' ? 'Cross' : 'Isolated'} />
                        <TagBadge label={`${position.leverage.value}x`} />
                    </XStack>
                    <Text color={pnlColor} fontSize={14} lineHeight={14} fontWeight={600}>
                        {winUsdc} ({winRatio})
                    </Text>
                </XStack>
            </YStack>

            {/* Size / Margin / Funding */}
            <YStack>
                <XStack gap={8} alignItems="center">
                    <YStack flex={1}>
                        <XStack alignItems="flex-start">
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                                Size({formatCoinName(position.coin)})
                            </Text>
                            <SwapIcon width={16} height={16} />
                        </XStack>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.szi?.replace(/^-/, '') || '--'}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                            Margin
                        </Text>
                        <XStack alignItems="center" gap={2}>
                            <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                                {position.marginUsed ? formatUSDC(position.marginUsed) : '--'}
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
                            {formatUSDC(position.cumFunding.sinceOpen)}
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
                            {position.entryPx}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14}>
                            Mark Price
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {marketPrice || '--'}
                        </Text>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} textAlign="right">
                            Liq. Price
                        </Text>
                        <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.liquidationPx ? formatAmount(position.liquidationPx, 4) : '--'}
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
                        <Text color="#429F37">{''}</Text>
                        <Text color="#171717"> / </Text>
                        <Text color="#FF372B">{''}</Text>
                    </Text>
                ) : (
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                        --/--
                    </Text>
                )}
            </XStack>

            {/* Action Buttons */}
            <XStack gap={12} alignItems="center" justifyContent="center">
                <ActionButton disabled={disabled} label="TP/SL" onPress={() => onTpSl?.(position)} />
                <ActionButton disabled={disabled} label="Limit Close" onPress={() => onLimitClose?.(position)} />
                <ActionButton disabled={disabled} label="Market Close" onPress={() => onMarketClose?.(position)} />
            </XStack>
        </YStack>
    );
});
