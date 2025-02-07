'use client';

import { forwardRef, type HTMLProps } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { classNames } from '@/helpers/classNames.js';

export interface ClickableButtonProps extends HTMLProps<HTMLButtonElement> {
    enableDefault?: boolean;
    enablePropagate?: boolean;
    enableOutline?: boolean;
    loading?: boolean;
    onlyLoading?: boolean;
    loadingSize?: number;
}

export const ClickableButton = forwardRef<HTMLButtonElement, ClickableButtonProps>(function ClickableButton(
    {
        enableDefault = false,
        enablePropagate = false,
        enableOutline = false,
        loading = false,
        onlyLoading = false,
        loadingSize = 20,
        children,
        onClick,
        ...props
    },
    ref,
) {
    return (
        <button
            {...props}
            type={props.type as 'button'}
            className={classNames(props.className, {
                'outline-none': !enableOutline,
                'disabled:cursor-not-allowed disabled:opacity-50': !!props.disabled,
                'flex items-center justify-center gap-1': loading,
            })}
            ref={ref}
            onClick={(event) => {
                if (props.disabled || loading) return;
                if (!enableDefault) event.preventDefault();
                if (!enablePropagate) event.stopPropagation();
                onClick?.(event);
            }}
        >
            {loading ? (
                <>
                    {onlyLoading ? null : children}
                    <LoadingIcon size={loadingSize} />
                </>
            ) : (
                children
            )}
        </button>
    );
});
