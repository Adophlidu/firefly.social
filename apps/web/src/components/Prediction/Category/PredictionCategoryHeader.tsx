'use client';

import { memo } from 'react';

import { PredictionCategoryTabs } from '@/components/Prediction/Category/PredictionCategoryTabs.js';
import type { PredictionCategoryTab } from '@/helpers/prediction/category/constants.js';

interface Props {
    title: string;
    tab: PredictionCategoryTab;
    availableTabs: PredictionCategoryTab[];
    onTabChange: (tab: PredictionCategoryTab) => void;
    categorySlug?: string;
}

export const PredictionCategoryHeader = memo<Props>(function PredictionCategoryHeader({
    title,
    tab,
    availableTabs,
    onTabChange,
    categorySlug,
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="min-w-0 truncate text-2xl font-black text-main">{title}</h1>
            <PredictionCategoryTabs
                tab={tab}
                availableTabs={availableTabs}
                onTabChange={onTabChange}
                categorySlug={categorySlug}
            />
        </div>
    );
});
