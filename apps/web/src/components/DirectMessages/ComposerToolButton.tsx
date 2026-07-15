'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, type ReactNode } from 'react';

interface ComposerToolButtonProps {
    icon: ReactNode;
    label: string;
    disabled?: boolean;
    onClick: () => void;
}

// A single composer toolbar entry. Adding an input action (media, GIF, and future ones) is dropping
// one of these in, so the button styling and disabled treatment stay in one place.
export const ComposerToolButton = memo(function ComposerToolButton({
    icon,
    label,
    disabled = false,
    onClick,
}: ComposerToolButtonProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={classNames('grid size-8 place-items-center rounded-xl hover:bg-line', {
                'cursor-not-allowed opacity-50': disabled,
            })}
            aria-label={label}
            onClick={onClick}
        >
            {icon}
        </button>
    );
});
