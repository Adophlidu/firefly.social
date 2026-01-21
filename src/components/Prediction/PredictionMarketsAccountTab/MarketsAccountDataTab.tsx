'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { MarketsAccountTabType, useMarketsAccountTab } from '@/hooks/prediction/useMarketsAccountTab.js';

export const MarketsAccountDataTab = memo(function MarketsAccountDataTab() {
    const [currentTab, setCurrentTab] = useMarketsAccountTab();

    return (
        <Tabs
            value={currentTab}
            onChange={setCurrentTab}
            className={classNames(
                'sticky z-30 mt-4 bg-primaryBottom px-4',
                IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]',
            )}
            variant="main"
        >
            {[
                { value: MarketsAccountTabType.Markets, label: <Trans>Markets</Trans> },
                { value: MarketsAccountTabType.Positions, label: <Trans>Positions</Trans> },
            ].map((tab) => (
                <Tab value={tab.value} key={tab.value}>
                    {tab.label}
                </Tab>
            ))}
        </Tabs>
    );
});
