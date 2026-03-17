import { type ReactNode } from 'react';

import { Comeback } from '@/components/Comeback.js';

interface PredictionProfilePageHeaderProps {
    pageTitle?: ReactNode;
}

export function PredictionEventPageHeader({ pageTitle }: PredictionProfilePageHeaderProps) {
    return (
        <div className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
            <div className="flex min-w-0 items-center gap-2">
                <Comeback className="cursor-pointer text-lightMain" />
                {pageTitle ? <span className="min-w-0 truncate text-xl font-black text-main">{pageTitle}</span> : null}
            </div>
        </div>
    );
}
