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
        'border-secondaryLine flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-base font-semibold transition-colors',
        isActive ? 'border-highlight text-highlight' : 'text-main hover:border-main',
    );

export const PredictionCategorySecondaryChip = memo<Props>(function PredictionCategorySecondaryChip({
    isActive = false,
    className,
    children,
}) {
    return <span className={classNames(secondaryChipClassName(isActive), className)}>{children}</span>;
});
