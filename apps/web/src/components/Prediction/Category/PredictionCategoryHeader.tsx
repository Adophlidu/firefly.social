'use client';

import { memo } from 'react';

import { PredictionCategoryTabs } from '@/components/Prediction/Category/PredictionCategoryTabs.js';
import type { PredictionCategoryTab } from '@/helpers/prediction/category/constants.js';

interface Props {
    title: string;
    tab: PredictionCategoryTab;
    showGames: boolean;
    onTabChange: (tab: PredictionCategoryTab) => void;
}

export const PredictionCategoryHeader = memo<Props>(function PredictionCategoryHeader({
    title,
    tab,
    showGames,
    onTabChange,
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="text-main min-w-0 truncate text-2xl font-black">{title}</h1>
            <PredictionCategoryTabs tab={tab} showGames={showGames} onTabChange={onTabChange} />
        </div>
    );
});
