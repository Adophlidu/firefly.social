'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, type ReactNode } from 'react';

interface Props {
    isActive?: boolean;
    className?: string;
    children: ReactNode;
}

export const secondaryChipClassName = (isActive: boolean) =>
    classNames(
        'flex shrink-0 items-center gap-1 rounded-[20px] px-3 py-2 text-base font-semibold leading-6 transition-colors',
        isActive ? 'border border-secondaryLine bg-bg text-main' : 'border border-secondaryLine text-main hover:bg-bg',
    );

export const PredictionCategorySecondaryChip = memo<Props>(function PredictionCategorySecondaryChip({
    isActive = false,
    className,
    children,
}) {
    return <span className={classNames(secondaryChipClassName(isActive), className)}>{children}</span>;
});
