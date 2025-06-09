import { t } from '@lingui/core/macro';
import { useRef } from 'react';

import BlockIcon from '@/assets/block.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';

interface TwitterBlockButtonProps extends Omit<ClickableButtonProps, 'children'> {
    isBlocked: boolean;
    variant?: 'text' | 'icon';
}

export function TwitterBlockButton({ isBlocked, className, variant = 'text', ref, ...rest }: TwitterBlockButtonProps) {
    const hoverRef = useRef<HTMLButtonElement>(null!);

    const variantClassName = {
        text: 'min-w-[112px]',
        icon: 'size-8 shrink-0',
    }[variant];

    return (
        <ClickableButton
            ref={hoverRef}
            className={classNames(
                'flex h-8 items-center justify-center rounded-full border border-danger text-medium font-semibold transition-all hover:cursor-default',
                isBlocked ? 'bg-danger text-white' : 'text-danger',
                className,
                variantClassName,
            )}
            {...rest}
        >
            {variant === 'text' ? t`Blocked` : <BlockIcon className="size-4 flex-shrink-0" />}
        </ClickableButton>
    );
}
