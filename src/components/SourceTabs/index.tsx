'use client';
import { classNames } from '@firefly/utils';
import { type HTMLProps, type PropsWithChildren } from 'react';

import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';

export function SourceTabs({ className, children }: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
    return (
        <div
            className={classNames(
                'no-scrollbar sticky top-[54px] z-30 flex w-full items-center overflow-x-auto overflow-y-hidden border-b border-line bg-primaryBottom px-3 md:top-0',
                {
                    'top-[53px]': IS_APPLE && IS_SAFARI,
                },
                className,
            )}
        >
            <nav className="no-scrollbar flex min-w-0 grow gap-3 overflow-x-auto text-xl" aria-label="Tabs">
                {children}
            </nav>
        </div>
    );
}
