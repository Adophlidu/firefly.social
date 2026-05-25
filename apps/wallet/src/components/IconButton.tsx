import CloseIcon from '@dimensiondev/assets/close.svg';
import CloseCircleIcon from '@dimensiondev/assets/close-circle.svg';
import DraftIconIcon from '@dimensiondev/assets/draft.svg';
import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, type ReactNode } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { cn } from '@/lib/utils.js';

interface IconButtonProps extends ClickableButtonProps {
    tooltip?: ReactNode;
    size?: number;
    children?: ReactNode;
}

export const IconButton = memo(function IconButton({ size = 24, tooltip, children, ref, ...props }: IconButtonProps) {
    const Button = (
        <ClickableButton {...props} className={cn('rounded p-1 hover:bg-lightBg', props.className)}>
            {children}
        </ClickableButton>
    );
    return (
        <Tooltip>
            <TooltipTrigger asChild>{Button}</TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
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
                className={cn('text-main', IconProps?.className, {
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
                className={cn('text-main', IconProps?.className, {
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
                className={cn('text-main', IconProps?.className, {
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
                className={cn('text-main', IconProps?.className, {
                    'cursor-pointer': !rest.disabled,
                })}
                width={size}
                height={size}
            />
        </IconButton>
    );
});
