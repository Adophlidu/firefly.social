import { BigNumber } from 'bignumber.js';
import { useEffect, useRef } from 'react';
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';

import { getLimitPriceCentsInputConfig } from '@/helpers/getLimitPriceCentsInputConfig.js';
import { normalizeBetInput } from '@/helpers/normalizeBetInput.js';

/**
 * react-hook-form defaultValues only apply on first mount.
 * This hook sets `limitPriceCents` on initial mount and when switching token/outcome,
 * but does NOT overwrite the field on real-time price updates.
 */
export function useSyncLimitPriceCents<TFieldValues extends FieldValues & { limitPriceCents: string }>(
    form: UseFormReturn<TFieldValues>,
    args: { defaultLimitPrice?: string | number | null; tokenId: string; orderPriceMinTickSize?: number | null },
) {
    const { defaultLimitPrice, tokenId, orderPriceMinTickSize } = args;

    const defaultLimitPriceRef = useRef(defaultLimitPrice);
    defaultLimitPriceRef.current = defaultLimitPrice;

    useEffect(() => {
        const price = defaultLimitPriceRef.current;
        const cfg = getLimitPriceCentsInputConfig(orderPriceMinTickSize);
        const field = 'limitPriceCents' as Path<TFieldValues>;
        if (price === null || price === undefined || price === '') {
            form.setValue(field, '' as PathValue<TFieldValues, typeof field>, {
                shouldDirty: false,
                shouldTouch: false,
                shouldValidate: true,
            });
            return;
        }

        const max = BigNumber(cfg.max);
        const centsBN = BigNumber(price).times(100);
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
    }, [tokenId, orderPriceMinTickSize]);
}
