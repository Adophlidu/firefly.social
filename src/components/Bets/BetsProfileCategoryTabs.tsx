'use client';

import { Trans } from '@lingui/react/macro';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { Category, useBetsProfileTab } from '@/hooks/bets/useBetsProfileTab.js';

const categories = [
    { value: Category.Positions, label: <Trans>Positions</Trans> },
    { value: Category.Trades, label: <Trans>Trades</Trans> },
];

export function BetsProfileCategoryTabs({ address }: { address: string }) {
    const [currentTab, setCurrentTab] = useBetsProfileTab();

    return (
        <Tabs value={currentTab} onChange={setCurrentTab} variant="default">
            {categories.map((tab) => (
                <Tab value={tab.value} key={tab.value}>
                    {tab.label}
                </Tab>
            ))}
        </Tabs>
    );
}
