'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps, ReactNode } from 'react';
import { memo } from 'react';

import CloseIcon from '@/assets/close.svg';
import CloseCircleIcon from '@/assets/close-circle.svg';
import DraftIconIcon from '@/assets/draft.svg';
import LeftArrowIcon from '@/assets/left-arrow.svg';
import UndoIcon from '@/assets/undo.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';

interface IconButtonProps extends ClickableButtonProps {
    tooltip?: ReactNode;
    size?: number;
    children?: ReactNode;
}

export const IconButton = memo(function IconButton({ size = 24, tooltip, children, ref, ...props }: IconButtonProps) {
    const Button = (
        <ClickableButton
            role="button"
            {...props}
            className={classNames('rounded p-1 hover:bg-lightBg', props.className)}
        >
            {children}
        </ClickableButton>
    );
    return (
        <Tooltip content={tooltip} placement="top">
            {Button}
        </Tooltip>
    );
});

interface ButtonProps extends Omit<IconButtonProps, 'children'> {
    IconProps?: HTMLProps<SVGElement>;
}

export const CloseButton = memo(function CloseButton({ size = 24, tooltip, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={tooltip ?? <Trans>Close</Trans>} aria-label="Close" {...rest}>
            <CloseIcon
                {...IconProps}
                className={classNames('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});

export const ClearButton = memo(function ClearButton({ size = 24, tooltip, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={tooltip ?? <Trans>Clear</Trans>} aria-label="Clear" {...rest}>
            <CloseCircleIcon
                {...IconProps}
                className={classNames('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});

export const BackButton = memo(function BackButton({ size = 24, tooltip, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={tooltip ?? <Trans>Back</Trans>} aria-label="Back" {...rest}>
            <LeftArrowIcon
                {...IconProps}
                className={classNames('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});

export const UndoButton = memo(function UndoButton({ size = 24, tooltip, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={tooltip ?? <Trans>Back</Trans>} aria-label="Back" {...rest}>
            <UndoIcon
                {...IconProps}
                className={classNames('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});

export const DraftButton = memo(function DraftButton({ size = 24, tooltip, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={tooltip ?? <Trans>Draft</Trans>} aria-label="Draft" {...rest}>
            <DraftIconIcon
                {...IconProps}
                className={classNames('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});
