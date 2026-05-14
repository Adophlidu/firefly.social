import { memo } from 'react';
import { Button, Text, XStack } from 'tamagui';

import type { KlineInterval } from '@/components/PerpKlineChart/types.js';

const INTERVALS: readonly KlineInterval[] = ['1m', '15m', '1h', '4h', 'D'];

export interface PerpKlineIntervalPillsProps {
    value: KlineInterval;
    onChange: (interval: KlineInterval) => void;
}

export const PerpKlineIntervalPills = memo<PerpKlineIntervalPillsProps>(function PerpKlineIntervalPills({
    value,
    onChange,
}) {
    return (
        <XStack alignItems="center">
            {INTERVALS.map((interval) => {
                const active = interval === value;
                return (
                    <Button
                        key={interval}
                        unstyled
                        height={36}
                        minWidth={44}
                        paddingHorizontal={6}
                        justifyContent="center"
                        alignItems="center"
                        pressStyle={{ opacity: 0.75 }}
                        onPress={() => onChange(interval)}
                    >
                        <Text
                            color={active ? '$text' : '$textDisabled'}
                            fontSize={13}
                            lineHeight={17}
                            fontWeight={500}
                        >
                            {interval}
                        </Text>
                    </Button>
                );
            })}
        </XStack>
    );
});
