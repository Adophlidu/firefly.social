import { t } from '@lingui/core/macro';
import { useMemo, useRef } from 'react';
import { useHover } from 'usehooks-ts';

import BlockIcon from '@/assets/block.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';

enum BlockLabel {
    Block = 'Block',
    Unblock = 'Unblock',
    Blocked = 'Blocked',
}

interface TwitterBlockButtonProps extends Omit<ClickableButtonProps, 'children'> {
    isBlocked: boolean;
    variant?: 'text' | 'icon';
}

export function TwitterBlockButton({ isBlocked, className, variant = 'text', ref, ...rest }: TwitterBlockButtonProps) {
    const hoverRef = useRef<HTMLButtonElement>(null!);
    const isHover = useHover(hoverRef);
    const buttonState = isHover ? BlockLabel.Unblock : BlockLabel.Blocked;

    const buttonText = useMemo(() => {
        if (variant === 'icon') {
            return <BlockIcon className="size-4 flex-shrink-0" />;
        }
        return isHover ? t`Unblock` : t`Blocked`;
    }, [isHover, variant]);

    const variantClassName = {
        text: 'min-w-[112px]',
        icon: 'size-8 shrink-0',
    }[variant];

    return (
        <ClickableButton
            ref={hoverRef}
            className={classNames(
                'flex h-8 items-center justify-center rounded-full border-danger text-medium font-semibold transition-all',
                buttonState === BlockLabel.Blocked ? 'border' : '',
                buttonState === BlockLabel.Unblock ? 'border border-danger border-opacity-50' : '',
                isBlocked ? 'bg-danger text-white' : 'text-danger',
                className,
                variantClassName,
            )}
            {...rest}
            disabled
        >
            {buttonText}
        </ClickableButton>
    );
}
