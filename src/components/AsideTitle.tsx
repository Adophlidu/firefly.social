import { type HTMLProps, memo, type ReactNode } from 'react';

import { classNames } from '@/helpers/classNames.js';

interface AsideTitleProps extends HTMLProps<HTMLHeadingElement> {
    caption: ReactNode;
    more?: ReactNode;
}

export const AsideTitle = memo(function AsideTitle({ children, className, ...props }: AsideTitleProps) {
    return (
        <div className={classNames('flex items-center justify-between px-3 pb-4', className)}>
            <h2 className="text-xl font-bold leading-none">{props.caption}</h2>
            {props.more}
        </div>
    );
});
