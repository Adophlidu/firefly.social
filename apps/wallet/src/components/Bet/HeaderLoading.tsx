import type { HTMLProps } from 'react';

import { cn } from '@/lib/utils.js';

export function HeaderLoading({ className }: HTMLProps<'div'>) {
    return (
        <div
            className={cn(
                'inline-flex w-full flex-col items-center justify-start gap-8 rounded-3xl pb-4 pt-8',
                className,
            )}
        >
            <div className="flex flex-col items-center justify-start gap-2">
                <div className="h-10 w-60 rounded-lg bg-lightBg" />
                <div className="h-4 w-28 rounded bg-lightBg" />
            </div>
            <div className="flex flex-col items-start justify-start gap-3 self-stretch">
                <div className="inline-flex items-center justify-center gap-3 self-stretch">
                    <div className="h-16 flex-1 rounded-2xl bg-lightBg" />
                    <div className="h-16 flex-1 rounded-2xl bg-lightBg" />
                </div>
                <div className="h-16 self-stretch rounded-2xl bg-lightBg" />
            </div>
        </div>
    );
}
