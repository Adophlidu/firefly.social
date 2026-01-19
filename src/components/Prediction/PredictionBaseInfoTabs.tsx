'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { BetsEventInfoTab, useBetsEventInfoTab } from '@/hooks/prediction/useBetsEventInfoTab.js';

const tabs = [
    { value: BetsEventInfoTab.TopHolders, label: <Trans>Top Holders</Trans> },
    { value: BetsEventInfoTab.Trades, label: <Trans>Trades</Trans> },
    { value: BetsEventInfoTab.Info, label: <Trans>Info</Trans> },
    { value: BetsEventInfoTab.Resolution, label: <Trans id="bets-resolution">Resolution</Trans> },
];

export const PredictionBaseInfoTabs = memo<{
    showResolution?: boolean;
}>(function PredictionBaseInfoTabs({ showResolution }) {
    const [tab, setTab] = useBetsEventInfoTab(showResolution);

    return (
        <Tabs
            value={tab}
            onChange={setTab}
            className={classNames(
                'sticky z-30 mt-4 bg-primaryBottom px-4',
                IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]',
            )}
            variant="main"
        >
            {tabs
                .filter((tab) => showResolution || tab.value !== BetsEventInfoTab.Resolution)
                .map((tab) => (
                    <Tab value={tab.value} key={tab.value}>
                        {tab.label}
                    </Tab>
                ))}
        </Tabs>
    );
});
