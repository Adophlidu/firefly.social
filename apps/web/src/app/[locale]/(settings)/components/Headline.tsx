import { classNames } from '@dimensiondev/utils';
import { type HTMLProps } from 'react';

interface HeadlineProps extends HTMLProps<HTMLDivElement> {
    hideInMobile?: boolean;
}

export function Headline({ className, hideInMobile = true, children }: HeadlineProps) {
    return (
        <div
            className={classNames(
                'w-full items-center justify-between gap-6',
                hideInMobile ? 'hidden lg:flex' : 'flex',
                className,
            )}
        >
            <span className="text-main text-[20px] font-bold leading-6">{children}</span>
        </div>
    );
}
