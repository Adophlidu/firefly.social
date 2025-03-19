import { classNames } from '@/helpers/classNames.js';

interface SubtitleProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

export function Subtitle({ className, children }: SubtitleProps) {
    return (
        <div className={classNames('flex w-full items-center justify-between leading-[18px]', className)}>
            <span className="text-[18px] font-bold text-main">{children}</span>
        </div>
    );
}
