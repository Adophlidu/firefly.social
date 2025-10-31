'use client';

import { classNames } from '@firefly/utils';
import type { HTMLProps } from 'react';

export function ActivityCellAction({ children, className }: HTMLProps<'div'>) {
    return (
        <div
            className={classNames(
                className,
                'flex h-6 max-w-full items-center space-x-1 text-sm font-normal leading-6',
            )}
        >
            {children}
        </div>
    );
}
