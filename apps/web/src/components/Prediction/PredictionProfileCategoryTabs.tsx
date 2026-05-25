'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { Category, usePredictionProfileTab } from '@/hooks/prediction/usePredictionProfileTab.js';

const categories = [
    { value: Category.Positions, label: <Trans>Positions</Trans> },
    { value: Category.Trades, label: <Trans>Trades</Trans> },
];

export function PredictionProfileCategoryTabs() {
    const [currentTab, setCurrentTab] = usePredictionProfileTab();

    return (
        <Tabs
            value={currentTab}
            onChange={setCurrentTab}
            className={classNames('sticky z-30 bg-primaryBottom', IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]')}
            variant="default"
        >
            {categories.map((tab) => (
                <Tab value={tab.value} key={tab.value}>
                    {tab.label}
                </Tab>
            ))}
        </Tabs>
    );
}
