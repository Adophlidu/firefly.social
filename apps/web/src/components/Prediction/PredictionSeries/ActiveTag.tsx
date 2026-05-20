import { classNames } from '@dimensiondev/utils';

export type ActiveTagVariant = 'warn' | 'danger';

interface ActiveTagProps {
    className?: string;
    variant?: ActiveTagVariant;
}

const variantDotClass: Record<ActiveTagVariant, string> = {
    warn: 'bg-warn',
    danger: 'bg-danger',
};

export function ActiveTag({ className, variant = 'warn' }: ActiveTagProps) {
    const dotClass = variantDotClass[variant];

    return (
        <div className={classNames('relative flex items-center justify-center overflow-visible', className)}>
            <div className={classNames('relative z-10 size-[7px] rounded-full', dotClass)} />
            <div
                className={classNames('absolute -inset-px size-[9px] animate-ping rounded-full opacity-75', dotClass)}
            />
        </div>
    );
}
