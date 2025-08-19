'use client';

import type { HTMLProps } from 'react';
import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { classNames } from '@/helpers/classNames.js';

interface LoadingProps extends HTMLProps<HTMLDivElement> {
    minHeight?: number | string;
}

export const Loading = memo(function Loading({ className, minHeight = 500 }: LoadingProps) {
    return (
        <div
            className={classNames('flex items-center justify-center', className)}
            style={{
                minHeight,
            }}
            data-page-loading
        >
            <LoadingIcon />
        </div>
    );
});
