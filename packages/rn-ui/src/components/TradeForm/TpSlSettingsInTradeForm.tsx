import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { TokenAmountInput } from '@/components/TokenAmountInput';
import { CheckboxChecked } from '@/icons/CheckboxChecked';
import { CheckboxUnchecked } from '@/icons/CheckboxUnchecked';
import { orderSafeTypeAtom, setOrderSafeTypeAtom, slRatioAtom, tpRatioAtom } from '@/store/tradeForm';

interface Props {}

export const TpSlSettingsInTradeForm = memo<Props>(function TpSlSettingsInTradeForm() {
    const safeType = useAtomValue(orderSafeTypeAtom);
    const setSafeType = useSetAtom(setOrderSafeTypeAtom);
    const [tpRatio, setTpRatio] = useAtom(tpRatioAtom);
    const [slRatio, setSlRatio] = useAtom(slRatioAtom);

    return (
        <YStack marginTop="$1.5">
            <Button unstyled onPress={() => setSafeType('reduceOnly')}>
                <XStack height={24} alignItems="center" gap={6}>
                    {safeType === 'reduceOnly' ? <CheckboxChecked /> : <CheckboxUnchecked />}
                    <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                        Reduce Only
                    </Text>
                </XStack>
            </Button>
            <Button unstyled onPress={() => setSafeType('tpSl')}>
                <XStack height={24} alignItems="center" gap={6}>
                    <Button unstyled onPress={() => setSafeType('tpSl')} pressStyle={{ opacity: 0.75 }}>
                        {safeType === 'tpSl' ? <CheckboxChecked /> : <CheckboxUnchecked />}
                    </Button>
                    <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                        TP / SL
                    </Text>
                </XStack>
            </Button>
            {safeType === 'tpSl' ? (
                <YStack gap="$1.5">
                    <XStack
                        paddingHorizontal={8}
                        borderRadius={6}
                        borderWidth={1}
                        borderColor="$borderSubdued"
                        alignItems="center"
                        gap="$2"
                        height={32}
                    >
                        <TokenAmountInput
                            placeholder="Gain"
                            flex={1}
                            height="100%"
                            decimal={2}
                            value={tpRatio}
                            onChangeText={(value) => setTpRatio(value)}
                        />
                        <Text fontSize={14} fontWeight={500} color="$text">
                            %
                        </Text>
                    </XStack>
                    <XStack
                        paddingHorizontal={8}
                        borderRadius={6}
                        borderWidth={1}
                        borderColor="$borderSubdued"
                        alignItems="center"
                        gap="$2"
                        height={32}
                    >
                        <TokenAmountInput
                            placeholder="Loss"
                            flex={1}
                            height="100%"
                            decimal={2}
                            value={slRatio}
                            onChangeText={(value) => setSlRatio(value)}
                        />
                        <Text fontSize={14} fontWeight={500} color="$text">
                            %
                        </Text>
                    </XStack>
                </YStack>
            ) : null}
        </YStack>
    );
});
