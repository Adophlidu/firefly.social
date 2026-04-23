import type { ComponentProps } from 'react';
import { memo, useCallback } from 'react';
import type { Input } from 'tamagui';

import { UnstyledInput } from '@/components/UnstyledInput';

interface Props extends ComponentProps<typeof Input> {
    decimal?: number;
    supportNegative?: boolean;
}

export const TokenAmountInput = memo<Props>(function TokenAmountInput({
    onChangeText,
    decimal = 0,
    supportNegative = false,
    ...rest
}) {
    const onInputChange = useCallback(
        (text: string) => {
            if (!text) {
                onChangeText?.('');
                return;
            }

            const regex = supportNegative
                ? new RegExp(`^-?\\d*\\.?\\d{0,${decimal}}$`)
                : new RegExp(`^\\d*\\.?\\d{0,${decimal}}$`);
            if (regex.test(text)) {
                onChangeText?.(text);
            }
        },
        [decimal, supportNegative, onChangeText],
    );

    return <UnstyledInput onChangeText={onInputChange} inputMode="decimal" keyboardType="decimal-pad" {...rest} />;
});
