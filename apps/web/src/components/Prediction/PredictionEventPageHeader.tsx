import type { ReactNode } from 'react';

import { Comeback } from '@/components/Comeback.js';

interface PredictionProfilePageHeaderProps {
    pageTitle?: ReactNode;
}

export function PredictionEventPageHeader({ pageTitle }: PredictionProfilePageHeaderProps) {
    return (
        <div className="border-line bg-primaryBottom sticky top-0 z-40 flex h-11 items-center justify-between border-b px-4 md:h-[60px]">
            <div className="flex min-w-0 items-center gap-2">
                <Comeback className="text-lightMain cursor-pointer" />
                {pageTitle ? (
                    <span className="text-main min-w-0 truncate text-lg font-semibold leading-6 md:text-xl md:font-black">
                        {pageTitle}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
