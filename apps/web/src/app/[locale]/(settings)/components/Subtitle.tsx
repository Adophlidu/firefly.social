import { classNames } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

interface SubtitleProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

export function Subtitle({ className, children }: SubtitleProps) {
    return (
        <div className={classNames('flex w-full items-center justify-between leading-[18px]', className)}>
            <span className="text-[18px] font-bold text-main">{children}</span>
        </div>
    );
}
