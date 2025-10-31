'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps, ReactNode } from 'react';
import { memo } from 'react';

import CloseIcon from '@/assets/close.svg';
import CloseCircleIcon from '@/assets/close-circle.svg';
import DraftIconIcon from '@/assets/draft.svg';
import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';

interface IconButtonProps extends ClickableButtonProps {
    tooltip?: ReactNode;
    size?: number;
    children?: ReactNode;
}

export const IconButton = memo(function IconButton({ size = 24, tooltip, children, ref, ...props }: IconButtonProps) {
    const Button = (
        <ClickableButton {...props} className={classNames('rounded p-1 hover:bg-lightBg', props.className)}>
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

export const CloseButton = memo(function CloseButton({ size = 24, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={<Trans>Close</Trans>} {...rest}>
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

export const ClearButton = memo(function ClearButton({ size = 24, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={<Trans>Clear</Trans>} {...rest}>
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

export const BackButton = memo(function BackButton({ size = 24, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={<Trans>Back</Trans>} {...rest}>
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

export const DraftButton = memo(function DraftButton({ size = 24, IconProps, ...rest }: ButtonProps) {
    return (
        <IconButton size={size} tooltip={<Trans>Draft</Trans>} {...rest}>
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
