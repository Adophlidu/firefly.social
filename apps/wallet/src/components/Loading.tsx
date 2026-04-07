import { type HTMLProps, memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { cn } from '@/lib/utils.js';

interface LoadingProps extends HTMLProps<HTMLDivElement> {
    minHeight?: number | string;
}

export const Loading = memo(function Loading({ className, minHeight = 500 }: LoadingProps) {
    return (
        <div
            className={cn('text-main flex items-center justify-center', className)}
            style={{
                minHeight,
            }}
            data-page-loading
        >
            <LoadingIcon />
        </div>
    );
});
