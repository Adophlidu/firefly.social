'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapToggleGroupProps } from '@/types/snap.js';

interface Props {
    props: SnapToggleGroupProps;
    accent: SnapAccentColor;
}

export function SnapToggleGroup({ props: { name, mode = 'single', options, value: defaultValue }, accent }: Props) {
    const { fields, setToggleGroup } = useSnapContext();
    const current = fields.toggleGroups[name] ?? defaultValue;

    function isSelected(val: string): boolean {
        if (!current) return false;
        if (Array.isArray(current)) return current.includes(val);
        return current === val;
    }

    function handleSelect(val: string) {
        if (mode === 'single') {
            setToggleGroup(name, val);
        } else {
            const arr = Array.isArray(current) ? current : current ? [current as string] : [];
            if (arr.includes(val)) {
                setToggleGroup(
                    name,
                    arr.filter((v) => v !== val),
                );
            } else {
                setToggleGroup(name, [...arr, val]);
            }
        }
    }

    const activeColor = ACCENT_COLOR_MAP[accent];

    return (
        <div className="flex w-full gap-1" onClick={(e) => e.stopPropagation()}>
            {options.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={classNames(
                            'border-line flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            selected
                                ? classNames(activeColor, 'border-transparent text-white')
                                : 'text-main hover:bg-bg bg-transparent',
                        )}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
