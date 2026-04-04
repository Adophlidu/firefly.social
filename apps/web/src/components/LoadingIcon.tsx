import Loading from '@dimensiondev/assets/loading.svg';
import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, memo } from 'react';

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
