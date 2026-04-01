'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';

import BlockIcon from '@/assets/block.svg';
import PendingIcon from '@/assets/pending.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';

interface TwitterBlockButtonProps extends Omit<ClickableButtonProps, 'children'> {
    isBlocked?: boolean;
    isPending?: boolean;
    variant?: 'text' | 'icon';
}

export function TwitterFollowButton({
    isBlocked,
    isPending,
    className,
    variant = 'text',
    ref,
    ...rest
}: TwitterBlockButtonProps) {
    const hoverRef = useRef<HTMLButtonElement>(null!);

    const variantClassName = {
        text: 'min-w-[112px]',
        icon: 'size-8 shrink-0 !border-transparent',
    }[variant];

    if (!isBlocked && !isPending) return null;

    const BlockLabel = variant === 'text' ? <Trans>Blocked</Trans> : <BlockIcon className="size-4 shrink-0" />;
    const PendingLabel = variant === 'text' ? <Trans>Pending</Trans> : <PendingIcon className="size-4 shrink-0" />;
    return (
        <ClickableButton
            ref={hoverRef}
            className={classNames(
                'flex h-8 items-center justify-center rounded-full border text-medium font-semibold transition-all hover:cursor-default',
                className,
                variantClassName,
                {
                    'border-danger bg-danger text-white': !!isBlocked,
                    'border-danger bg-danger': isBlocked === false && isPending === undefined,
                    'bg-primaryBottom text-main': !!isPending,
                },
            )}
            {...rest}
        >
            {isPending ? PendingLabel : isBlocked ? BlockLabel : null}
        </ClickableButton>
    );
}
