import { classNames } from '@dimensiondev/utils';

interface ActiveTagProps {
    className?: string;
}

export function ActiveTag({ className }: ActiveTagProps) {
    return (
        <div className={classNames('relative flex items-center justify-center', className)}>
            <div className="bg-warn relative z-10 size-[7px] rounded-full" />
            <div className="bg-warn absolute -inset-px size-[9px] animate-ping rounded-full opacity-75" />
        </div>
    );
}
