import Loading from '@dimensiondev/assets/loading.svg';
import { type HTMLProps, memo } from 'react';

import { cn } from '@/lib/utils.js';

interface LoadingIconProps extends HTMLProps<SVGElement> {
    size?: number;
    animate?: boolean;
}

export const LoadingIcon = memo(function LoadingIcon({
    size = 24,
    animate = true,
    className,
    ...rest
}: LoadingIconProps) {
    return (
        <Loading
            {...rest}
            width={size}
            height={size}
            className={cn('shrink-0', animate ? 'animate-spin' : '', className)}
        />
    );
});
