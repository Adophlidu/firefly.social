'use client';

import { Trans } from '@lingui/react/macro';
import type { ReactNode, SVGProps } from 'react';

import CloseIcon from '@/assets/close.svg';
import CloseCircleIcon from '@/assets/close-circle.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';

interface IconButtonProps extends ClickableButtonProps {
    tooltip?: ReactNode;
    size?: number;
    children?: ReactNode;
}

function IconButton({ size = 24, tooltip, children, ref, ...props }: IconButtonProps) {
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
}

interface ButtonProps extends Omit<IconButtonProps, 'children'> {
    IconProps?: SVGProps<SVGSVGElement>;
}

export function CloseButton({ size = 24, IconProps, ...rest }: ButtonProps) {
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
}

export function ClearButton({ size = 24, IconProps, ...rest }: ButtonProps) {
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
}
