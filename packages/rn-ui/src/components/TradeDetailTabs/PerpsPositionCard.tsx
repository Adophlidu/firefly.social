import { Trans, useLingui } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { TagBadge } from '@/components/TagBadge';
import { formatCoinName } from '@/helpers/formatCoinName';
import { formatPrice } from '@/helpers/formatPrice';
import { formatUSDC } from '@/helpers/formatUSDC';
import { navigate } from '@/helpers/navigate';
import { dividedBy, isGreaterThan, isZero, multipliedBy } from '@/helpers/number';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { EditIcon } from '@/icons/EditIcon';
import { SwapIcon } from '@/icons/SwapIcon';
import type { Position } from '@/types/ui';

import { ButtonUI } from '../ButtonUI';

interface PerpsPositionCardProps {
    position: Position;
    /** TP/SL row data from `buildPositionTpSlByCoin` (includes `showViewOrders` for entry-attached TP/SL). */
    tpSl?: { tp: string; sl: string; showViewOrders?: boolean };
    disabled?: boolean;
    onLimitClose?: (position: Position) => void;
    onMarketClose?: (position: Position) => void;
    /** Isolated margin row: opens add-margin flow when set. */
    onAdjustMargin?: (position: Position) => void;
    onTpSl?: (position: Position) => void;
    /** When `tpSl.showViewOrders`, opens the open-orders tab (parent provides). */
    onViewOpenOrders?: () => void;
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

function ActionButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress?: () => void }) {
    return (
        <ButtonUI
            unstyled
            flex={1}
            backgroundColor="$bgHover"
            borderRadius={22}
            paddingVertical={8}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
            disabled={disabled}
            onPress={onPress}
        >
            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                {label}
            </Text>
        </ButtonUI>
    );
}

export const PerpsPositionCard = memo<PerpsPositionCardProps>(function PerpsPositionCard({
    position,
    tpSl,
    disabled,
    onLimitClose,
    onMarketClose,
    onAdjustMargin,
    onTpSl,
    onViewOpenOrders,
}) {
    const { i18n } = useLingui();
    const [sizeDisplayMode, setSizeDisplayMode] = useState<'coin' | 'usdc'>('coin');
    const toggleSizeDisplayMode = useCallback(() => {
        setSizeDisplayMode((m) => (m === 'coin' ? 'usdc' : 'coin'));
    }, []);

    const { data: coinInfo } = useCoinInfo(position.coin);

    const marketPrice = coinInfo?.assetCtx?.markPx;

    const pnlColor = isGreaterThan(position.unrealizedPnl, 0) ? '$textSuccess' : '$textCritical';
    const fundingColor = isGreaterThan(position.cumFunding.sinceOpen, 0) ? '$textSuccess' : '$textCritical';
    const isBuy = isGreaterThan(position.szi, '0');
    const directionVariant = isBuy ? 'buy' : 'sell';
    const directionLabel = isBuy ? i18n._('rn-ui.direction.buy') : i18n._('rn-ui.direction.sell');
    const canAdjustIsolatedMargin = position.leverage.type === 'isolated' && typeof onAdjustMargin === 'function';
    const szDecimals = coinInfo?.szDecimals || 2;

    const tpDisplay = tpSl?.tp ?? '--';
    const slDisplay = tpSl?.sl ?? '--';
    const showViewOrders = Boolean(tpSl?.showViewOrders);

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

    const sizeUsdcDisplay = useMemo(() => {
        if (!marketPrice) {
            return '--';
        }
        const sz = new BigNumber(position.szi || '0').abs();
        const mark = new BigNumber(marketPrice);
        if (!sz.isFinite() || sz.isZero() || !mark.isFinite() || mark.lte(0)) {
            return '--';
        }
        return formatUSDC(sz.multipliedBy(mark));
    }, [marketPrice, position.szi]);

    const sizeLabel =
        sizeDisplayMode === 'coin'
            ? i18n._('rn-ui.position.sizeCoin', { coin: formatCoinName(position.coin) })
            : i18n._('rn-ui.position.sizeUsdc');
    const sizeValue = sizeDisplayMode === 'coin' ? position.szi?.replace(/^-/, '') || '--' : sizeUsdcDisplay;

    return (
        <YStack backgroundColor="$bg" borderWidth={1} borderColor="$border" borderRadius={12} padding={12} gap={12}>
            {/* Header */}
            <YStack gap={4}>
                {/* Symbol Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack
                        alignItems="center"
                        gap={4}
                        onPress={() => {
                            navigate('details', { coin: position.coin });
                        }}
                        pressStyle={{ opacity: 0.72 }}
                        hoverStyle={{ opacity: 0.92 }}
                        cursor="pointer"
                    >
                        <Text color="$text" fontSize={14} lineHeight={14} fontWeight={600}>
                            {formatCoinName(position.coin)}
                        </Text>
                        <ArrowRightIcon />
                    </XStack>
                    <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                        <Trans id="rn-ui.position.pnlUsdc">PnL(USDC)</Trans>
                    </Text>
                </XStack>

                {/* Tags + PnL Row */}
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={4}>
                        <TagBadge label={directionLabel} variant={directionVariant} />
                        <TagBadge
                            label={
                                position.leverage.type === 'cross'
                                    ? i18n._('rn-ui.marginMode.cross.title')
                                    : i18n._('rn-ui.marginMode.isolated.title')
                            }
                        />
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
                    <YStack
                        flex={1}
                        onPress={toggleSizeDisplayMode}
                        pressStyle={{ opacity: 0.72 }}
                        hoverStyle={{ opacity: 0.92 }}
                        cursor="pointer"
                    >
                        <XStack alignItems="center" alignSelf="flex-start" gap={4}>
                            <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                                {sizeLabel}
                            </Text>
                            <SwapIcon width={16} height={16} />
                        </XStack>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {sizeValue}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            <Trans id="rn-ui.position.margin">Margin</Trans>
                        </Text>
                        <XStack alignItems="center" gap={2}>
                            <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                                {position.marginUsed ? formatUSDC(position.marginUsed) : '--'}
                            </Text>
                            {canAdjustIsolatedMargin ? (
                                <Button
                                    unstyled
                                    width={16}
                                    height={16}
                                    alignItems="center"
                                    justifyContent="center"
                                    pressStyle={{ opacity: 0.72 }}
                                    disabled={disabled}
                                    onPress={() => onAdjustMargin?.(position)}
                                    icon={<EditIcon width={16} height={16} />}
                                />
                            ) : null}
                        </XStack>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="$textDisabled" fontSize={12} lineHeight={14} textAlign="right">
                            <Trans id="rn-ui.position.funding">Funding</Trans>
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
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            <Trans id="rn-ui.position.entryPrice">Entry Price</Trans>
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {formatPrice(position.entryPx, szDecimals)}
                        </Text>
                    </YStack>

                    <YStack flex={1} paddingLeft={16}>
                        <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                            <Trans id="rn-ui.position.markPrice">Mark Price</Trans>
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {marketPrice ? formatPrice(marketPrice, szDecimals) : '--'}
                        </Text>
                    </YStack>

                    <YStack flex={1} alignItems="flex-end">
                        <Text color="$textDisabled" fontSize={12} lineHeight={14} textAlign="right">
                            <Trans id="rn-ui.position.liqPrice">Liq. Price</Trans>
                        </Text>
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {position.liquidationPx ? formatPrice(position.liquidationPx, szDecimals) : '--'}
                        </Text>
                    </YStack>
                </XStack>
            </YStack>

            {/* TP/SL — OneKey: entry TP/SL without position-order triggers → “View orders” */}
            <XStack alignItems="center" gap={4}>
                <Text color="$textDisabled" fontSize={12} lineHeight={14}>
                    <Trans id="rn-ui.tpsl.title">TP/SL</Trans>
                </Text>
                {showViewOrders ? (
                    <Text
                        color="$textSuccess"
                        fontSize={14}
                        lineHeight={20}
                        fontWeight={600}
                        onPress={() => {
                            if (!disabled) {
                                onViewOpenOrders?.();
                            }
                        }}
                        pressStyle={{ opacity: 0.72 }}
                        cursor="pointer"
                    >
                        <Trans id="rn-ui.position.viewOrders">View orders</Trans>
                    </Text>
                ) : (
                    <Text fontSize={14} lineHeight={20} fontWeight={600}>
                        <Text color="$textSuccess">{tpDisplay}</Text>
                        <Text color="$text"> / </Text>
                        <Text color="$textCritical">{slDisplay}</Text>
                    </Text>
                )}
            </XStack>

            {/* Action Buttons */}
            <XStack gap={12} alignItems="center" justifyContent="center">
                <ActionButton
                    disabled={disabled}
                    label={i18n._('rn-ui.tpsl.title')}
                    onPress={() => onTpSl?.(position)}
                />
                <ActionButton
                    disabled={disabled}
                    label={i18n._('rn-ui.position.limitClose')}
                    onPress={() => onLimitClose?.(position)}
                />
                <ActionButton
                    disabled={disabled}
                    label={i18n._('rn-ui.position.marketClose')}
                    onPress={() => onMarketClose?.(position)}
                />
            </XStack>
        </YStack>
    );
});
