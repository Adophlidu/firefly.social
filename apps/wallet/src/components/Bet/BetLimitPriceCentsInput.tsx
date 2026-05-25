import { BigNumber } from 'bignumber.js';
import { Minus, Plus } from 'lucide-react';
import type React from 'react';

import { normalizeBetInput } from '@/helpers/normalizeBetInput.js';
import { cn } from '@/lib/utils.js';

const normalize = (raw: string, maxDecimals: number, max: number) =>
    normalizeBetInput(raw, 'limitPriceCents', { maxDecimals, max });

export function BetLimitPriceCentsInput({
    value,
    onChange,
    onBlur,
    step = 1,
    maxDecimals = 1,
    max = 99.9,
    inputClassName,
}: {
    value: string;
    onChange: (next: string) => void;
    onBlur?: () => void;
    /** Increment/decrement step for +/- buttons and native input step. Default: 1 */
    step?: number | string;
    /** Max decimals allowed in the cents input. Default: 1 (supports 0.1¢) */
    maxDecimals?: number;
    /** Max allowed value (in cents). Default: 99.9 */
    max?: number | string;
    inputClassName?: string;
}) {
    const maxNum = typeof max === 'string' ? Number(max) : max;
    const handleChange = (raw: string) => {
        onChange(normalize(raw, maxDecimals, maxNum));
    };

    const base = BigNumber(value || 0);
    const canDecrease = base.isFinite() && base.gt(0);

    const applyDelta = (direction: -1 | 1) => {
        // When current value is 0, do not allow decrement (avoid weird normalize behavior from negative values).
        if (direction === -1 && !canDecrease) return;
        const next = (base.isFinite() ? base : BigNumber(0)).plus(BigNumber(step).times(direction));
        onChange(normalize(next.toString(), maxDecimals, maxNum));
    };
    return (
        <div className="flex h-12 w-[180px] items-center justify-between rounded-lg border border-line bg-transparent px-2 py-2.5">
            <button
                type="button"
                className="flex size-6 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => applyDelta(-1)}
                disabled={!canDecrease}
                aria-label="Decrease limit price"
            >
                <Minus className="size-4 text-main" />
            </button>
            <input
                type="number"
                inputMode="decimal"
                autoComplete="off"
                step={step}
                min={0}
                max={max}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={onBlur}
                className={cn(
                    'ring-none w-full appearance-none border-none bg-transparent text-center text-lg font-bold tabular-nums leading-6 text-main outline-none focus:ring-0',
                    inputClassName,
                )}
            />
            <div className="text-lg font-bold leading-6 text-main">¢</div>
            <button
                type="button"
                className="flex size-6 items-center justify-center"
                onClick={() => applyDelta(1)}
                aria-label="Increase limit price"
            >
                <Plus className="size-4 text-main" />
            </button>
        </div>
    );
}
