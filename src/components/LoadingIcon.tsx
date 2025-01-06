import type { HTMLProps } from 'react';

import { classNames } from '@/helpers/classNames.js';

interface LoadingIconProps extends HTMLProps<SVGElement> {
    size?: number;
    animate?: boolean;
}

export function LoadingIcon({ size = 24, animate = true, className, ...rest }: LoadingIconProps) {
    return (
        <LoadingIcon
            {...rest}
            width={size}
            height={size}
            className={classNames('shrink-0', animate ? 'animate-spin' : '', className)}
        />
    );
}
