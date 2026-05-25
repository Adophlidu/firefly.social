'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';

interface Props {
    tab: PredictionCategoryTab;
    showGames: boolean;
    onTabChange: (tab: PredictionCategoryTab) => void;
}

export const PredictionCategoryTabs = memo<Props>(function PredictionCategoryTabs({ tab, showGames, onTabChange }) {
    if (!showGames) return null;

    return (
        <div className="flex h-9 shrink-0 rounded-lg bg-bg p-0.5">
            <ClickableButton
                onClick={() => onTabChange(PREDICTION_CATEGORY_GAMES_TAB)}
                className={classNames(
                    'flex h-full flex-1 items-center justify-center rounded-md px-4 text-sm font-bold transition-colors',
                    tab === PREDICTION_CATEGORY_GAMES_TAB ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                )}
            >
                <Trans>Games</Trans>
            </ClickableButton>
            <ClickableButton
                onClick={() => onTabChange(PREDICTION_CATEGORY_PROPS_TAB)}
                className={classNames(
                    'flex h-full flex-1 items-center justify-center rounded-md px-4 text-sm font-bold transition-colors',
                    tab === PREDICTION_CATEGORY_PROPS_TAB ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                )}
            >
                <Trans>Props</Trans>
            </ClickableButton>
        </div>
    );
});
