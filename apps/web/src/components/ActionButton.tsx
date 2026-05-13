import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';

export interface ActionButtonProps extends ClickableButtonProps {
    variant?: 'primary' | 'secondary' | 'danger';
}

export const ActionButton = memo<ActionButtonProps>(function ActionButton({
    children,
    variant = 'primary',
    ref,
    ...props
}) {
    return (
        <ClickableButton
            {...props}
            className={classNames(
                'flex w-full flex-1 items-center justify-center rounded-full py-2 font-bold',
                {
                    'bg-main text-primaryBottom': variant === 'primary',
                    'border-main text-fourMain border border-opacity-40 py-2.5 text-sm leading-[18px]':
                        variant === 'secondary',
                    'bg-commonDanger text-white': variant === 'danger',
                },
                props.className,
            )}
        >
            {children}
        </ClickableButton>
    );
});
