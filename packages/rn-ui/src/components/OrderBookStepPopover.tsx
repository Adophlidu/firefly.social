import { useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { Button, Popover, Text, YStack } from 'tamagui';

import { useOrderBookSteps } from '@/hooks/Perps/useOrderBookSteps';
import { orderBookStepIndexAtom } from '@/store/global';

interface OrderBookStepPopoverProps {
    midPrice: string;
    szDecimals: number;
    children: ReactNode;
    placement?:
        | 'top'
        | 'top-start'
        | 'top-end'
        | 'bottom'
        | 'bottom-start'
        | 'bottom-end'
        | 'left'
        | 'left-start'
        | 'left-end'
        | 'right'
        | 'right-start'
        | 'right-end';
}

export const OrderBookStepPopover = memo<OrderBookStepPopoverProps>(function OrderBookStepPopover({
    midPrice,
    szDecimals,
    children,
    placement = 'top-end',
}) {
    const [stepIndex, setStepIndex] = useAtom(orderBookStepIndexAtom);

    const steps = useOrderBookSteps(midPrice, szDecimals);

    return (
        <Popover placement={placement}>
            <Popover.Trigger asChild>{children}</Popover.Trigger>
            <Popover.Content
                height={36 * steps.length}
                paddingVertical={0}
                paddingHorizontal="$5"
                boxShadow="0 8px 64px 0 rgba(0, 0, 0, 0.10)"
                backdropFilter="blur(40px)"
            >
                <YStack width="100%">
                    {steps.map((step, i) => (
                        <Popover.Close asChild key={step}>
                            <Button
                                unstyled
                                justifyContent="center"
                                width="100%"
                                height={36}
                                onPress={() => setStepIndex(i)}
                            >
                                <Text fontSize={14} fontWeight={500} color={i === stepIndex ? '$text' : '$textSubdued'}>
                                    {step}
                                </Text>
                            </Button>
                        </Popover.Close>
                    ))}
                </YStack>
            </Popover.Content>
        </Popover>
    );
});
