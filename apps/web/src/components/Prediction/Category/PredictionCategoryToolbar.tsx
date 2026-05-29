'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Comeback } from '@/components/Comeback.js';

export const PredictionCategoryToolbar = memo(function PredictionCategoryToolbar() {
    return (
        <div className="flex h-[60px] items-center gap-7 border-b border-line bg-primaryBottom px-4">
            <Comeback className="text-lightMain" />
            <span className="truncate text-xl font-black text-lightMain">
                <Trans>Predictions</Trans>
            </span>
        </div>
    );
});
