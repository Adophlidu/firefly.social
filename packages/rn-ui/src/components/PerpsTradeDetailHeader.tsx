import { memo, useCallback, useState } from 'react';
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
import type { CoinInfo, PerpsMeta } from '@/types/ui';

interface PerpsTradeDetailHeaderProps {
    coin: CoinInfo;
    onTokenSelect?: (token: PerpsMeta) => void;
}

export const PerpsTradeDetailHeader = memo<PerpsTradeDetailHeaderProps>(function PerpsTradeDetailHeader({
    coin,
    onTokenSelect = () => {},
}) {
    const [accountAmountSheetOpen, setAccountAmountSheetOpen] = useState(false);
    const [isTokenSelectorOpen, setTokenSelectorOpen] = useState(false);
    const { withdrawable, isLoading } = usePerpsComputedAccountValue();

    const onTokenChange = useCallback(
        (meta: PerpsMeta) => {
            onTokenSelect(meta);
            setTokenSelectorOpen(false);
        },
        [onTokenSelect],
    );

    const changeColor = (coin.priceDiffRatio ?? 0) < 0 ? '#FF372B' : '#429F37';
    const availableDisplay = isLoading ? '--' : formatUSDC(withdrawable ?? 0);

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
                    color="#181818"
                    fontSize={18}
                    lineHeight={24}
                    fontWeight={600}
                    fontFamily="$body"
                    textAlign="center"
                >
                    {coin.dex || 'Perps'}
                </Text>

                <Button
                    unstyled
                    backgroundColor="#F8F7F9"
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.03)"
                    borderRadius={16}
                    paddingHorizontal={12}
                    paddingVertical={6}
                    alignItems="center"
                    gap={6}
                    pressStyle={{ opacity: 0.75 }}
                    onPress={() => {
                        setAccountAmountSheetOpen(true);
                    }}
                >
                    <Text color="#171717" fontSize={14} lineHeight={20} fontWeight={600}>
                        {availableDisplay}
                    </Text>
                </Button>
            </XStack>

            <YStack paddingHorizontal={12} paddingVertical={8} gap={8}>
                <XStack alignItems="center" justifyContent="space-between">
                    <YStack onPress={() => setTokenSelectorOpen(true)}>
                        <XStack alignItems="center" gap={4}>
                            <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                                {`${formatCoinName(coin.name)}USDC`}
                            </Text>
                            <TagBadge label={`${coin.maxLeverage}x`} />
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
                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                {coin.dex || 'Perps'}
                            </Text>
                            {coin.priceDiffRatio ? (
                                <Text color={changeColor} fontSize={12} lineHeight={14} fontWeight={500}>
                                    {coin.priceDiffRatio.toFixed(2) || '-'}%
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
                        onPress={() => navigate('details', { coin: coin.name })}
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
