'use client';

import type { HTMLProps } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { classNames } from '@/helpers/classNames.js';

interface LoadingProps extends HTMLProps<HTMLDivElement> {}

export function Loading({ className }: LoadingProps) {
    return (
        <div className={classNames('flex min-h-[500px] items-center justify-center', className)} data-page-loading>
            <LoadingIcon />
        </div>
    );
}
