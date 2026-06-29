'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import {
    PREDICTION_CATEGORY_BRACKET_TAB,
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_GROUPS_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import { capturePolymarketHomeSportTypeClick } from '@/providers/telemetry/capturePolymarketEvent.js';

interface Props {
    tab: PredictionCategoryTab;
    availableTabs: PredictionCategoryTab[];
    onTabChange: (tab: PredictionCategoryTab) => void;
    categorySlug?: string;
}

export const PredictionCategoryTabs = memo<Props>(function PredictionCategoryTabs({
    tab,
    availableTabs,
    onTabChange,
    categorySlug,
}) {
    if (availableTabs.length < 2) return null;

    return (
        <div className="flex h-9 shrink-0 rounded-lg bg-bg p-0.5">
            {availableTabs.includes(PREDICTION_CATEGORY_GAMES_TAB) ? (
                <ClickableButton
                    onClick={() => {
                        if (categorySlug) capturePolymarketHomeSportTypeClick('games', categorySlug);
                        onTabChange(PREDICTION_CATEGORY_GAMES_TAB);
                    }}
                    className={classNames(
                        'flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-bold transition-colors',
                        tab === PREDICTION_CATEGORY_GAMES_TAB ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                    )}
                >
                    <Trans>Games</Trans>
                </ClickableButton>
            ) : null}
            {availableTabs.includes(PREDICTION_CATEGORY_PROPS_TAB) ? (
                <ClickableButton
                    onClick={() => {
                        if (categorySlug) capturePolymarketHomeSportTypeClick('props', categorySlug);
                        onTabChange(PREDICTION_CATEGORY_PROPS_TAB);
                    }}
                    className={classNames(
                        'flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-bold transition-colors',
                        tab === PREDICTION_CATEGORY_PROPS_TAB ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                    )}
                >
                    <Trans>Props</Trans>
                </ClickableButton>
            ) : null}
            {availableTabs.includes(PREDICTION_CATEGORY_BRACKET_TAB) ? (
                <ClickableButton
                    onClick={() => {
                        if (categorySlug) capturePolymarketHomeSportTypeClick('bracket', categorySlug);
                        onTabChange(PREDICTION_CATEGORY_BRACKET_TAB);
                    }}
                    className={classNames(
                        'flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-bold transition-colors',
                        tab === PREDICTION_CATEGORY_BRACKET_TAB
                            ? 'bg-primaryBottom text-main shadow-sm'
                            : 'text-second',
                    )}
                >
                    <Trans>Bracket</Trans>
                </ClickableButton>
            ) : null}
            {availableTabs.includes(PREDICTION_CATEGORY_GROUPS_TAB) ? (
                <ClickableButton
                    onClick={() => {
                        if (categorySlug) capturePolymarketHomeSportTypeClick('groups', categorySlug);
                        onTabChange(PREDICTION_CATEGORY_GROUPS_TAB);
                    }}
                    className={classNames(
                        'flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-bold transition-colors',
                        tab === PREDICTION_CATEGORY_GROUPS_TAB ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                    )}
                >
                    <Trans>Groups</Trans>
                </ClickableButton>
            ) : null}
        </div>
    );
});
