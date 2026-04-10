'use client';

import { classNames } from '@dimensiondev/utils';

import { SnapIcon } from '@/components/Snap/elements/SnapIcon.js';
import { ACCENT_BORDER_MAP, ACCENT_COLOR_MAP, ACCENT_TEXT_MAP } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapAction, type SnapButtonProps } from '@/types/snap.js';

interface Props {
    props: SnapButtonProps;
    accent: SnapAccentColor;
    onPress?: (action: SnapAction) => void;
    action?: SnapAction;
    disabled?: boolean;
}

export function SnapButton({
    props: { label, variant = 'secondary', icon },
    accent,
    onPress,
    action,
    disabled = false,
}: Props) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (action) onPress?.(action);
            }}
            className={classNames(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-opacity',
                variant === 'primary'
                    ? classNames('text-white', ACCENT_COLOR_MAP[accent])
                    : classNames('border bg-transparent', ACCENT_BORDER_MAP[accent], ACCENT_TEXT_MAP[accent]),
                { 'cursor-not-allowed opacity-50': disabled, 'hover:opacity-90': !disabled },
            )}
        >
            {icon ? <SnapIcon props={{ name: icon, color: 'inherit' }} /> : null}
            {label}
        </button>
    );
}
