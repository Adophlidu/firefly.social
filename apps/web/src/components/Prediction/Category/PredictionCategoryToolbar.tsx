'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { PredictionCategoryWalletEntry } from '@/components/Prediction/Category/PredictionCategoryWalletEntry.js';

export const PredictionCategoryToolbar = memo(function PredictionCategoryToolbar() {
    return (
        <div className="flex h-[60px] w-full items-center px-4 pt-2.5 max-md:hidden">
            <h1 className="truncate text-xl font-black text-main">
                <Trans>Predictions</Trans>
            </h1>
            <PredictionCategoryWalletEntry />
        </div>
    );
});
