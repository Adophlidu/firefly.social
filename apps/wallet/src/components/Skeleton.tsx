import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils.js';

export function Skeleton({
    className,
    isLoading = true,
    children,
}: PropsWithChildren<{ className?: string; isLoading?: boolean }>) {
    if (isLoading) return <div className={cn('animate-pulse rounded bg-lightBg', className)} />;
    return children;
}
