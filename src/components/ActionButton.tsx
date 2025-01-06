import { memo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { classNames } from '@/helpers/classNames.js';

export interface ActionButtonProps extends ClickableButtonProps {
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}

export const ActionButton = memo<ActionButtonProps>(function ActionButton({
    loading,
    children,
    variant = 'primary',
    ref,
    ...props
}) {
    return (
        <ClickableButton
            {...props}
            disabled={loading || props.disabled}
            className={classNames(
                'flex w-full flex-1 items-center justify-center rounded-full py-2 font-bold',
                {
                    'bg-main text-primaryBottom': variant === 'primary',
                    'border border-main border-opacity-40 py-[10px] text-sm leading-[18px] text-fourMain':
                        variant === 'secondary',
                    'bg-commonDanger text-lightBottom': variant === 'danger',
                },
                props.className,
            )}
        >
            {loading ? <LoadingIcon /> : children}
        </ClickableButton>
    );
});
