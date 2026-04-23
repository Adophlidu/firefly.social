import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { Button, Popover, Text, XStack, YStack } from 'tamagui';

import { TokenAmountInput } from '@/components/TokenAmountInput';
import { formatCoinName } from '@/helpers/formatCoinName';
import { SwitchIcon } from '@/icons/SwitchIcon';
import {
    coinNameAtom,
    priceDecimalAtom,
    setInputTypeAtom,
    setSizeInputValueAtom,
    sizeDecimalAtom,
    sizeInputTypeAtom,
    sizeInputValueAtom,
} from '@/store/tradeForm';

interface SizeInputProps {}

export const SizeInput = memo<SizeInputProps>(function SizeInput() {
    const coinName = useAtomValue(coinNameAtom);
    const inputType = useAtomValue(sizeInputTypeAtom);
    const setInputType = useSetAtom(setInputTypeAtom);
    const coinDecimal = useAtomValue(sizeDecimalAtom);
    const priceDecimal = useAtomValue(priceDecimalAtom);

    const inputValue = useAtomValue(sizeInputValueAtom);
    const setInputValue = useSetAtom(setSizeInputValueAtom);

    const disabled = false;

    return (
        <XStack
            borderRadius={6}
            borderWidth={1}
            borderColor="rgba(34, 33, 47, 0.15)"
            height={40}
            alignItems="center"
            paddingHorizontal={8}
            paddingVertical={5}
            gap={4}
        >
            <TokenAmountInput
                width="100%"
                height="100%"
                value={inputValue}
                onChangeText={setInputValue}
                decimal={inputType === 'amount' ? coinDecimal : priceDecimal}
            />
            <Popover placement="top-end">
                <Popover.Trigger disabled={disabled} asChild>
                    <Button unstyled>
                        <XStack alignItems="center" justifyContent="flex-end" gap={4}>
                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} fontWeight={500}>
                                {inputType === 'amount' ? formatCoinName(coinName) : 'USDC'}
                            </Text>
                            <SwitchIcon width={14} height={14} />
                        </XStack>
                    </Button>
                </Popover.Trigger>
                <Popover.Content
                    width={64}
                    height={72}
                    padding={0}
                    boxShadow="0 8px 64px 0 rgba(0, 0, 0, 0.10)"
                    backdropFilter="blur(40px)"
                >
                    <YStack width="100%">
                        <Popover.Close asChild>
                            <Button
                                unstyled
                                width="100%"
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="row"
                                height={36}
                                onPress={() => setInputType('usd')}
                            >
                                <Text fontSize={14} fontWeight={600} color="#171717">
                                    USDC
                                </Text>
                            </Button>
                        </Popover.Close>
                        <Popover.Close asChild>
                            <Button
                                unstyled
                                width="100%"
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="row"
                                verticalAlign="middle"
                                height={36}
                                onPress={() => setInputType('amount')}
                            >
                                <Text fontSize={14} fontWeight={600} color="#171717">
                                    {formatCoinName(coinName)}
                                </Text>
                            </Button>
                        </Popover.Close>
                    </YStack>
                </Popover.Content>
            </Popover>
        </XStack>
    );
});
