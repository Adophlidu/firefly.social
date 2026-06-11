'use client';

import type { SnapInputProps } from '@dimensiondev/workers-snap';

import { useSnapContext } from '@/components/Snap/SnapContext.js';

interface Props {
    props: SnapInputProps;
}

export function SnapInput({ props: { name, label, placeholder, type = 'text', maxLength, defaultValue = '' } }: Props) {
    const { fields, setInput } = useSnapContext();
    const value = fields.inputs[name] ?? defaultValue;

    return (
        <div className="w-full">
            {label ? <label className="mb-1 block text-xs font-medium text-secondary">{label}</label> : null}
            <input
                type={type}
                className="w-full rounded-lg border border-line1 bg-bg px-3 py-2 text-sm text-main outline-none placeholder:text-secondary focus:ring-1 focus:ring-current"
                placeholder={placeholder}
                value={value}
                maxLength={maxLength}
                onChange={(e) => setInput(name, e.target.value)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
