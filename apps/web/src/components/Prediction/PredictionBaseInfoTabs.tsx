'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useContext } from 'react';

import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { FIFA_SLUG } from '@/constants/bets.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { BetsEventInfoTab, useBetsEventInfoTab } from '@/hooks/prediction/useBetsEventInfoTab.js';
import {
    captureOpinionEventTabClick,
    capturePolymarketEventTabClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';

const tabs = [
    { value: BetsEventInfoTab.Comments, label: <Trans>Comments</Trans> },
    { value: BetsEventInfoTab.TopHolders, label: <Trans>Top Holders</Trans> },
    { value: BetsEventInfoTab.Trades, label: <Trans>Trades</Trans> },
    { value: BetsEventInfoTab.Info, label: <Trans>Info</Trans> },
    {
        value: BetsEventInfoTab.Resolution,
        label: (
            <Trans id="bets-resolution" comment="Resolution">
                Resolution
            </Trans>
        ),
    },
];

interface PredictionBaseInfoTabsProps {
    showResolution?: boolean;
    eventSlug?: string;
}
// Comments is a new tab not yet in the analytics tab schema; omitting it here
// makes tab-click telemetry gracefully no-op for Comments (see handleTabChange).
type TrackedEventTab = 'Top holders' | 'Trades' | 'Info' | 'Resolution';
const tabNameMap: Partial<Record<BetsEventInfoTab, TrackedEventTab>> = {
    [BetsEventInfoTab.TopHolders]: 'Top holders',
    [BetsEventInfoTab.Trades]: 'Trades',
    [BetsEventInfoTab.Info]: 'Info',
    [BetsEventInfoTab.Resolution]: 'Resolution',
};

export const PredictionBaseInfoTabs = memo<PredictionBaseInfoTabsProps>(function PredictionBaseInfoTabs({
    showResolution,
    eventSlug,
}) {
    const { platform } = useContext(PredictionContext);
    // Orb comments are FIFA-only for now
    const showComments = !!eventSlug?.startsWith(FIFA_SLUG);
    const [tab, setTab] = useBetsEventInfoTab(showResolution, showComments);

    const handleTabChange = (newTab: BetsEventInfoTab) => {
        setTab(newTab);
        if (!eventSlug) return;

        const tabName = tabNameMap[newTab];
        if (!tabName) return;

        if (platform === 'polymarket') {
            capturePolymarketEventTabClick(eventSlug, tabName);
        } else if (platform === 'opinion') {
            captureOpinionEventTabClick(eventSlug, tabName);
        }
    };

    return (
        <Tabs
            value={tab}
            onChange={handleTabChange}
            className={classNames(
                'sticky z-30 mt-4 bg-primaryBottom px-4',
                IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]',
            )}
            variant="main"
        >
            {tabs
                .filter((tab) => {
                    if (!showResolution && tab.value === BetsEventInfoTab.Resolution) return false;
                    if (!showComments && tab.value === BetsEventInfoTab.Comments) return false;
                    return true;
                })
                .map((tab) => (
                    <Tab value={tab.value} key={tab.value}>
                        {tab.label}
                    </Tab>
                ))}
        </Tabs>
    );
});
