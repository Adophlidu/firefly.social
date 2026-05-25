import { memo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { cn } from '@/lib/utils.js';

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
            className={cn(
                'flex w-full flex-1 items-center justify-center rounded-full py-2 font-bold',
                {
                    'bg-main text-primaryBottom': variant === 'primary',
                    'border border-main border-opacity-40 py-2.5 text-sm leading-[18px] text-fourMain':
                        variant === 'secondary',
                    'bg-commonDanger text-lightBottom': variant === 'danger',
                },
                props.className,
            )}
        >
            {children}
        </ClickableButton>
    );
});
