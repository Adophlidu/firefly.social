'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Comeback } from '@/components/Comeback.js';

export const PredictionCategoryToolbar = memo(function PredictionCategoryToolbar() {
    return (
        <div className="bg-primaryBottom border-line sticky top-0 z-30 flex h-[60px] items-center gap-7 border-b px-4">
            <Comeback className="text-lightMain" />
            <span className="text-lightMain truncate text-xl font-black">
                <Trans>Predictions</Trans>
            </span>
        </div>
    );
});
