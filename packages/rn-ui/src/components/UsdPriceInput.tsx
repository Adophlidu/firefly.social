import type { ComponentProps } from 'react';
import { memo, useCallback } from 'react';
import type { Input } from 'tamagui';

import { UnstyledInput } from '@/../../../packages/rn-ui/src/components/UnstyledInput';
import { formatPrice } from '@/helpers/formatPrice';
import { normalizePriceInput, validatePerpsPriceInput, validateSpotPriceInput } from '@/helpers/perpsPriceValidation';

interface Props extends ComponentProps<typeof Input> {
    szDecimals: number;
    isSpot?: boolean;
    formatOnBlur?: boolean;
}

export const UsdPriceInput = memo<Props>(function UsdPriceInput({
    value,
    onChangeText,
    onBlur,
    szDecimals,
    isSpot = false,
    formatOnBlur = false,
    ...rest
}) {
    const handleChangeText = useCallback(
        (text: string) => {
            if (!text) {
                onChangeText?.('');
                return;
            }

            const normalized = normalizePriceInput(text);
            const isValid = isSpot
                ? validateSpotPriceInput(normalized, szDecimals)
                : validatePerpsPriceInput(normalized, szDecimals);

            if (isValid) {
                onChangeText?.(normalized);
            }
        },
        [isSpot, onChangeText, szDecimals],
    );

    const handleBlur = useCallback(
        (e: Parameters<NonNullable<typeof onBlur>>[0]) => {
            if (formatOnBlur && typeof value === 'string' && value) {
                onChangeText?.(formatPrice(value, szDecimals, isSpot));
            }
            onBlur?.(e);
        },
        [formatOnBlur, isSpot, onBlur, onChangeText, szDecimals, value],
    );

    return (
        <UnstyledInput
            value={value}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            inputMode="decimal"
            keyboardType="decimal-pad"
            {...rest}
        />
    );
});
