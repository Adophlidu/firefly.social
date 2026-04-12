import type { PropsWithChildren } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { cn } from '@/lib/utils.js';

export function LoadingPanel({ children, className }: PropsWithChildren<{ className?: string }>) {
    return (
        <div className={cn('flex h-48 w-full flex-col items-center justify-center', className)}>
            <LoadingIcon />
            <h4 className="mt-2 text-sm font-medium">{children}</h4>
        </div>
    );
}
