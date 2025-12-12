import { classNames } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';
import { memo } from 'react';

import Loading from '@/assets/loading.svg';

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
            className={classNames('shrink-0', animate ? 'animate-spin' : '', className)}
            role="status"
            aria-label="Loading"
        />
    );
});
