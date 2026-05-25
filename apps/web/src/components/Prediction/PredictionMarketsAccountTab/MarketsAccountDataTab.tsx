'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Tab, Tabs } from '@/components/Tabs/index.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { MarketsAccountTabType } from '@/providers/prediction/polymarket/constants.js';
import {
    captureOpinionEventTabClick,
    capturePolymarketEventTabClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';

const tabNameMap = {
    [MarketsAccountTabType.Markets]: 'Markets',
    [MarketsAccountTabType.Positions]: 'Positions',
    [MarketsAccountTabType.Orders]: 'Open order',
} as const;

interface Props {
    platform: PredictionPlatform;
    eventSlug: string;
    currentTab: MarketsAccountTabType;
    onTabChange: (tab: MarketsAccountTabType) => void;
}

export const MarketsAccountDataTab = memo<Props>(function MarketsAccountDataTab({
    platform,
    eventSlug,
    currentTab,
    onTabChange,
}) {
    return (
        <Tabs
            value={currentTab}
            onChange={onTabChange}
            className={classNames(
                'sticky z-30 mt-4 bg-primaryBottom px-4',
                IS_APPLE && IS_SAFARI ? 'top-[53px]' : 'top-[54px]',
            )}
            variant="main"
        >
            {[
                { value: MarketsAccountTabType.Markets, label: <Trans>Markets</Trans> },
                { value: MarketsAccountTabType.Positions, label: <Trans>Positions</Trans> },
                { value: MarketsAccountTabType.Orders, label: <Trans>Open Orders</Trans> },
            ].map((tab) => (
                <Tab
                    value={tab.value}
                    key={tab.value}
                    onClick={() => {
                        const tabName = tabNameMap[tab.value];
                        if (!tabName) return;
                        if (platform === 'polymarket') {
                            capturePolymarketEventTabClick(eventSlug, tabName);
                        } else if (platform === 'opinion') {
                            captureOpinionEventTabClick(eventSlug, tabName);
                        }
                    }}
                >
                    {tab.label}
                </Tab>
            ))}
        </Tabs>
    );
});
