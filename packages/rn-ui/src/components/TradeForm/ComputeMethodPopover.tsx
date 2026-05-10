import { memo } from 'react';
import { Button, Popover, Text, useTheme, XStack, YStack } from 'tamagui';

import { ChevronDownIcon } from '@/icons/ChevronDownIcon';
import type { ComputeMethod } from '@/types/ui';

interface Props {
    disabled?: boolean;
    type: ComputeMethod;
    onChange: (type: ComputeMethod) => void;
}

export const ComputeMethodPopover = memo<Props>(function ComputeMethodPopover({ disabled = false, type, onChange }) {
    const theme = useTheme();
    return (
        <Popover placement="top-end">
            <Popover.Trigger disabled={disabled} asChild>
                <Button unstyled height="100%">
                    <XStack alignItems="center" height="100%" gap={2}>
                        <Text fontSize={14} fontWeight={500} color="$text">
                            {type === 'ratio' ? '%' : '$'}
                        </Text>
                        <ChevronDownIcon width={14} height={14} stroke={theme.textDisabled!.get()} />
                    </XStack>
                </Button>
            </Popover.Trigger>
            <Popover.Content
                width={64}
                height={72}
                padding={0}
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
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
                            onPress={() => onChange('ratio')}
                        >
                            <Text fontSize={14} fontWeight={600} color="$text">
                                %
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
                            onPress={() => onChange('usd')}
                        >
                            <Text fontSize={14} fontWeight={600} color="$text">
                                $
                            </Text>
                        </Button>
                    </Popover.Close>
                </YStack>
            </Popover.Content>
        </Popover>
    );
});
