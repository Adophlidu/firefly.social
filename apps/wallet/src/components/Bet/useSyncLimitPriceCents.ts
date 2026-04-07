import { BigNumber } from 'bignumber.js';
import { useEffect } from 'react';
import { type FieldValues, type Path, type PathValue, type UseFormReturn } from 'react-hook-form';

import { getLimitPriceCentsInputConfig } from '@/helpers/getLimitPriceCentsInputConfig.js';
import { normalizeBetInput } from '@/helpers/normalizeBetInput.js';

/**
 * react-hook-form defaultValues only apply on first mount.
 * This hook keeps `limitPriceCents` in sync when switching token/outcome.
 */
export function useSyncLimitPriceCents<TFieldValues extends FieldValues & { limitPriceCents: string }>(
    form: UseFormReturn<TFieldValues>,
    args: { defaultLimitPrice?: string | number | null; tokenId: string; orderPriceMinTickSize?: number | null },
) {
    const { defaultLimitPrice, tokenId, orderPriceMinTickSize } = args;

    useEffect(() => {
        const cfg = getLimitPriceCentsInputConfig(orderPriceMinTickSize);
        const field = 'limitPriceCents' as Path<TFieldValues>;
        if (defaultLimitPrice === null || defaultLimitPrice === undefined || defaultLimitPrice === '') {
            form.setValue(field, '' as PathValue<TFieldValues, typeof field>, {
                shouldDirty: false,
                shouldTouch: false,
                shouldValidate: true,
            });
            return;
        }

        const max = BigNumber(cfg.max);
        const centsBN = BigNumber(defaultLimitPrice).times(100);
        // Limit price cents should always "round down" to the allowed precision (no rounding up).
        const rounded = centsBN.decimalPlaces(cfg.maxDecimals, BigNumber.ROUND_FLOOR);
        const clampedBN = BigNumber.min(max, BigNumber.max(0, rounded));
        const clampedStr = normalizeBetInput(clampedBN.toString(), 'limitPriceCents', {
            maxDecimals: cfg.maxDecimals,
            max: max.toNumber(),
        });
        form.setValue(field, String(clampedStr) as PathValue<TFieldValues, typeof field>, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultLimitPrice, tokenId, orderPriceMinTickSize]);
}
