'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapSwitchProps } from '@/types/snap.js';

interface Props {
    props: SnapSwitchProps;
    accent: SnapAccentColor;
}

export function SnapSwitch({ props: { name, label, value: defaultValue = false }, accent }: Props) {
    const { fields, setSwitch } = useSnapContext();
    const checked = fields.switches[name] ?? defaultValue;

    return (
        <div className="flex w-full items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
            {label ? <span className="text-main text-sm">{label}</span> : null}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => setSwitch(name, !checked)}
                className={classNames(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                    checked ? ACCENT_COLOR_MAP[accent] : 'bg-gray-300 dark:bg-gray-600',
                )}
            >
                <span
                    className={classNames(
                        'pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition',
                        checked ? 'translate-x-5' : 'translate-x-0',
                    )}
                />
            </button>
        </div>
    );
}
