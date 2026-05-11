import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useState } from 'react';
import { Circle, Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { AccountAmountSheet } from '@/components/AccountAmountSheet';
import { PerpsTokenSelectSheet } from '@/components/PerpsTokenSelectSheet';
import { TagBadge } from '@/components/TagBadge';
import { formatCoinName } from '@/helpers/formatCoinName';
import { formatUSDC } from '@/helpers/formatUSDC';
import { navigate } from '@/helpers/navigate';
import { usePerpsComputedAccountValue } from '@/hooks/Perps/usePerpsComputedAccountValue';
import { BackIcon } from '@/icons/BackIcon';
import { ChartIcon } from '@/icons/ChartIcon';
import { ChevronDownIcon } from '@/icons/ChevronDownIcon';
import type { PerpsMeta } from '@/types/ui';

function DepositHeaderIcon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Circle cx={10} cy={10} r={8.75} stroke="#FFFFFF" strokeWidth={1.2} />
            <Path
                d="M10 6.75V11.25M7.25 11.25L10 13L12.75 11.25"
                stroke="#FFFFFF"
                strokeWidth={1.35}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

interface PerpsTradeDetailHeaderProps {
    dex: string;
    name: string;
    maxLeverage: number;
    priceDiffRatio?: number;
    onTokenSelect?: (token: PerpsMeta) => void;
}

export const PerpsTradeDetailHeader = memo<PerpsTradeDetailHeaderProps>(function PerpsTradeDetailHeader({
    dex,
    name,
    maxLeverage,
    priceDiffRatio,
    onTokenSelect = () => {},
}) {
    const [accountAmountSheetOpen, setAccountAmountSheetOpen] = useState(false);
    const [isTokenSelectorOpen, setTokenSelectorOpen] = useState(false);
    const { accountValue, isLoading } = usePerpsComputedAccountValue();

    const onTokenChange = useCallback(
        (meta: PerpsMeta) => {
            onTokenSelect(meta);
            setTokenSelectorOpen(false);
        },
        [onTokenSelect],
    );

    const changeColor = (priceDiffRatio ?? 0) < 0 ? '$textCritical' : '$textSuccess';
    // Avoid flashing Deposit: when loading ends, accountValue can still be undefined for a tick
    // before clearinghouse marginSummary is applied — do not treat undefined as zero.
    const accountValueReady = !isLoading && accountValue !== undefined;
    const totalDisplay = accountValueReady ? formatUSDC(accountValue) : '--';
    const showDepositCta = accountValueReady && new BigNumber(accountValue).lte(0);
    const dexLabel = dex || 'Perps';

    return (
        <YStack>
            <XStack height={44} alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
                <Button
                    unstyled
                    width={24}
                    height={24}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.72 }}
                    onPress={() => navigate('__parent__', {})}
                    icon={<BackIcon width={24} height={24} />}
                />

                <Text
                    color="$text"
                    fontSize={18}
                    lineHeight={24}
                    fontWeight={600}
                    fontFamily="$body"
                    textAlign="center"
                >
                    {dexLabel}
                </Text>

                <Button
                    unstyled
                    backgroundColor={showDepositCta ? '$accent' : '$bgSubdued'}
                    borderWidth={showDepositCta ? 0 : 1}
                    borderColor={showDepositCta ? 'transparent' : '$bgHover'}
                    borderRadius={16}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.75 }}
                    onPress={() => {
                        if (showDepositCta) {
                            void navigate('addFunds', {});
                            return;
                        }
                        setAccountAmountSheetOpen(true);
                    }}
                >
                    {showDepositCta ? (
                        <XStack alignItems="center" gap={4}>
                            <DepositHeaderIcon />
                            <Text color="#FFFFFF" fontSize={14} lineHeight={20} fontWeight={600}>
                                Deposit
                            </Text>
                        </XStack>
                    ) : (
                        <Text color="$text" fontSize={14} lineHeight={20} fontWeight={600}>
                            {totalDisplay}
                        </Text>
                    )}
                </Button>
            </XStack>

            <YStack paddingHorizontal={12} paddingVertical={8} gap={8}>
                <XStack alignItems="center" justifyContent="space-between">
                    <YStack onPress={() => setTokenSelectorOpen(true)}>
                        <XStack alignItems="center" gap={4}>
                            <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                                {`${formatCoinName(name)}USDC`}
                            </Text>
                            <TagBadge label={`${maxLeverage}x`} />
                            <Button
                                unstyled
                                width={16}
                                height={16}
                                alignItems="center"
                                justifyContent="center"
                                pressStyle={{ opacity: 0.72 }}
                                icon={<ChevronDownIcon />}
                            />
                        </XStack>
                        <XStack alignItems="center" gap={4}>
                            <Text color="$textSubdued" fontSize={13} lineHeight={17} fontWeight={500}>
                                {dexLabel}
                            </Text>
                            {priceDiffRatio ? (
                                <Text color={changeColor} fontSize={12} lineHeight={14} fontWeight={500}>
                                    {priceDiffRatio.toFixed(2) || '-'}%
                                </Text>
                            ) : null}
                        </XStack>
                    </YStack>
                    <Button
                        unstyled
                        width={24}
                        height={24}
                        alignItems="center"
                        justifyContent="center"
                        pressStyle={{ opacity: 0.72 }}
                        onPress={() => navigate('details', { coin: name })}
                        icon={<ChartIcon width={24} height={24} />}
                    />
                </XStack>
            </YStack>

            <AccountAmountSheet open={accountAmountSheetOpen} onOpenChange={setAccountAmountSheetOpen} />

            <PerpsTokenSelectSheet
                open={isTokenSelectorOpen}
                onOpenChange={setTokenSelectorOpen}
                onTokenSelected={onTokenChange}
            />
        </YStack>
    );
});
