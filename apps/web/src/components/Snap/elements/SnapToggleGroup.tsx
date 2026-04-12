'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import type { SnapAccentColor, SnapToggleGroupProps } from '@/types/snap.js';

interface Props {
    props: SnapToggleGroupProps;
    accent: SnapAccentColor;
}

export function SnapToggleGroup({
    props: { name, label, multiple = false, options, defaultValue, orientation = 'horizontal', variant = 'default' },
    accent,
}: Props) {
    const { fields, setToggleGroup } = useSnapContext();
    const current = fields.toggleGroups[name] ?? defaultValue;

    function isSelected(val: string): boolean {
        if (!current) return false;
        if (Array.isArray(current)) return current.includes(val);
        return current === val;
    }

    function handleSelect(val: string) {
        if (!multiple) {
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
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {label ? <label className="text-secondary mb-1 block text-xs font-medium">{label}</label> : null}
            <div className={classNames('flex w-full gap-1', { 'flex-col': orientation === 'vertical' })}>
                {options.map((opt) => {
                    const selected = isSelected(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            className={classNames(
                                'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                                variant === 'outline'
                                    ? classNames(
                                          'border',
                                          selected
                                              ? classNames(activeColor, 'border-transparent text-white')
                                              : 'border-line1 text-main hover:bg-bg bg-transparent',
                                      )
                                    : classNames(
                                          'border-line1 border',
                                          selected
                                              ? classNames(activeColor, 'border-transparent text-white')
                                              : 'text-main hover:bg-bg bg-transparent',
                                      ),
                            )}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
