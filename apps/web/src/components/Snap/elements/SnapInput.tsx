'use client';

import { useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapInputProps } from '@/types/snap.js';

interface Props {
    props: SnapInputProps;
}

export function SnapInput({
    props: { name, label, placeholder, type = 'text', maxLength, value: defaultValue = '' },
}: Props) {
    const { fields, setInput } = useSnapContext();
    const value = fields.inputs[name] ?? defaultValue;

    return (
        <div className="w-full">
            {label ? <label className="text-secondary mb-1 block text-xs font-medium">{label}</label> : null}
            <input
                type={type}
                className="border-line bg-bg text-main placeholder:text-secondary w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-current"
                placeholder={placeholder}
                value={value}
                maxLength={maxLength}
                onChange={(e) => setInput(name, e.target.value)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
