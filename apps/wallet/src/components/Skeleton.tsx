import { type PropsWithChildren } from 'react';

import { cn } from '@/lib/utils.js';

export function Skeleton({
    className,
    isLoading = true,
    children,
}: PropsWithChildren<{ className?: string; isLoading?: boolean }>) {
    if (isLoading) return <div className={cn('bg-lightBg animate-pulse rounded', className)} />;
    return children;
}
