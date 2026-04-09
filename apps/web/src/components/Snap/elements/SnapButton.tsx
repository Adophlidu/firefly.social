'use client';

import { classNames } from '@dimensiondev/utils';

import { ACCENT_COLOR_MAP } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapAction, type SnapButtonProps } from '@/types/snap.js';

interface Props {
    props: SnapButtonProps;
    accent: SnapAccentColor;
    onPress?: (action: SnapAction) => void;
    action?: SnapAction;
    disabled?: boolean;
}

export function SnapButton({ props: { label }, accent, onPress, action, disabled = false }: Props) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (action) onPress?.(action);
            }}
            className={classNames(
                'flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity',
                ACCENT_COLOR_MAP[accent],
                { 'cursor-not-allowed opacity-50': disabled, 'hover:opacity-90': !disabled },
            )}
        >
            {label}
        </button>
    );
}
