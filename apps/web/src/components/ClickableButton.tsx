'use client';

import { classNames } from '@dimensiondev/utils';
import { type ButtonHTMLAttributes, type DetailedHTMLProps, memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';

export interface ClickableButtonProps
    extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    enableDefault?: boolean;
    enablePropagate?: boolean;
    enableOutline?: boolean;
    loading?: boolean;
    onlyLoading?: boolean;
    loadingSize?: number;
}

export const ClickableButton = memo(function ClickableButton({
    enableDefault = false,
    enablePropagate = false,
    enableOutline = false,
    loading = false,
    onlyLoading = false,
    loadingSize = 20,
    children,
    ref,
    onClick,
    ...props
}: ClickableButtonProps) {
    return (
        <button
            role="button"
            {...props}
            disabled={props.disabled || loading}
            className={classNames(props.className, {
                'outline-none': !enableOutline,
                'disabled:cursor-not-allowed disabled:opacity-50': !!props.disabled || loading,
                'flex items-center justify-center gap-1': loading,
            })}
            ref={ref}
            onClick={(event) => {
                if (props.disabled || loading) return;
                if (!enableDefault && props.type !== 'submit') event.preventDefault();
                if (!enablePropagate && props.type !== 'submit') event.stopPropagation();
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
