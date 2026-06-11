'use client';

import { classNames } from '@dimensiondev/utils';
import type { SnapAccentColor, SnapSliderProps } from '@dimensiondev/workers-snap';
import { useLayoutEffect } from 'react';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';

interface Props {
    props: SnapSliderProps;
    accent: SnapAccentColor;
}

export function SnapSlider({
    props: { name, label, min = 0, max = 100, step = 1, defaultValue, showValue = false },
    accent,
}: Props) {
    const { fields, setSlider } = useSnapContext();
    const clamp = (n: number) => Math.min(max, Math.max(min, n));
    const clampedInitial = clamp(defaultValue ?? min);
    const stored = fields.sliders[name];
    const value = stored !== undefined ? clamp(stored) : clampedInitial;

    useLayoutEffect(() => {
        if (fields.sliders[name] !== undefined) return;
        setSlider(name, clampedInitial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    const range = max - min;
    const pct = range === 0 ? 0 : ((value - min) / range) * 100;

    return (
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {label || showValue ? (
                <div className="mb-1 flex justify-between">
                    {label ? <label className="text-xs font-medium text-secondary">{label}</label> : <span />}
                    {showValue ? <span className="text-xs text-secondary">{value}</span> : null}
                </div>
            ) : null}
            <div className="relative flex items-center">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-bg">
                    <div
                        className={classNames('h-full rounded-full', ACCENT_COLOR_MAP[accent])}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <input
                    type="range"
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => setSlider(name, Number(e.target.value))}
                />
            </div>
        </div>
    );
}
