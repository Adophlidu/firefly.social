'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapSliderProps } from '@/types/snap.js';

interface Props {
    props: SnapSliderProps;
    accent: SnapAccentColor;
}

export function SnapSlider({
    props: { name, label, min = 0, max = 100, step = 1, value: defaultValue },
    accent,
}: Props) {
    const { fields, setSlider } = useSnapContext();
    const value = fields.sliders[name] ?? defaultValue ?? min;
    const pct = ((value - min) / (max - min)) * 100;

    return (
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {label ? (
                <div className="mb-1 flex justify-between">
                    <label className="text-secondary text-xs font-medium">{label}</label>
                    <span className="text-secondary text-xs">{value}</span>
                </div>
            ) : null}
            <div className="relative flex items-center">
                <div className="bg-bg relative h-2 w-full overflow-hidden rounded-full">
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
