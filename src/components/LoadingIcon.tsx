import type { SVGProps } from 'react';

import Loading from '@/assets/loading.svg';
import { classNames } from '@/helpers/classNames.js';

interface LoadingIconProps extends SVGProps<SVGSVGElement> {
    size?: number;
    animate?: boolean;
}

export function LoadingIcon({ size = 24, animate = true, className, ...rest }: LoadingIconProps) {
    return (
        <Loading
            {...rest}
            width={size}
            height={size}
            className={classNames('shrink-0', animate ? 'animate-spin' : '', className)}
        />
    );
}
