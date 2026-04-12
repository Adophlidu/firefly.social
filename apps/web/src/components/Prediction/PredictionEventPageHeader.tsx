import type { ReactNode } from 'react';

import { Comeback } from '@/components/Comeback.js';

interface PredictionProfilePageHeaderProps {
    pageTitle?: ReactNode;
}

export function PredictionEventPageHeader({ pageTitle }: PredictionProfilePageHeaderProps) {
    return (
        <div className="border-line bg-primaryBottom sticky top-0 z-40 flex h-[60px] items-center justify-between border-b px-4">
            <div className="flex min-w-0 items-center gap-2">
                <Comeback className="text-lightMain cursor-pointer" />
                {pageTitle ? <span className="text-main min-w-0 truncate text-xl font-black">{pageTitle}</span> : null}
            </div>
        </div>
    );
}
