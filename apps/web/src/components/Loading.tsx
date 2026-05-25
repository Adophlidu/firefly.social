'use client';

import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';

interface LoadingProps extends HTMLProps<HTMLDivElement> {
    minHeight?: number | string;
}

export const Loading = memo(function Loading({ className, minHeight = 500 }: LoadingProps) {
    return (
        <div
            className={classNames('flex items-center justify-center text-main', className)}
            style={{
                minHeight,
            }}
            data-page-loading
            role="status"
            aria-label="Loading"
        >
            <LoadingIcon />
        </div>
    );
});
