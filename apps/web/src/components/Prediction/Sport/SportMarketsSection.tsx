'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { memo, useMemo } from 'react';

import {
    SportMarketGroupCard,
    type SportMarketSectionConfig,
} from '@/components/Prediction/Sport/SportMarketGroupCard.js';
import type { SportChartConfig } from '@/components/Prediction/Sport/SportPriceLineChart.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { getSportMarketTabs, type SportMarketResolvedTab } from '@/helpers/prediction/sportMarketTabs.js';
import type { BetsEventDataForUI, SportEventData } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

function getMainLineForSection(
    type: SportMarketGroupType,
    mainLines: { spreadsMainLine?: number; totalsMainLine?: number },
): number | undefined {
    if (type === SportMarketGroupType.Spread) return mainLines.spreadsMainLine;
    if (type === SportMarketGroupType.Total) return mainLines.totalsMainLine;
    return undefined;
}

/**
 * Convert resolved tab data into card-ready section configs.
 * The tab already contains resolved sections with their markets.
 */
function buildSections(
    tab: SportMarketResolvedTab | undefined,
    mainLines: { spreadsMainLine?: number; totalsMainLine?: number },
): SportMarketSectionConfig[] {
    if (!tab) return [];

    return tab.sections
        .filter((section) => section.markets.length > 0)
        .map((section, index) => ({
            key: `${tab.key}:section:${index}`,
            type: section.renderAs,
            title: section.title,
            markets: section.markets,
            mainLine: getMainLineForSection(section.renderAs, mainLines),
            mergeByLine: section.mergeByLine,
            renderAs: section.renderAs,
        }));
}

interface SportMarketsSectionProps {
    event: BetsEventDataForUI;
    sportData: SportEventData;
}

export const SportMarketsSection = memo(function SportMarketsSection({ event, sportData }: SportMarketsSectionProps) {
    const { homeTeam, awayTeam, isDraw, ended, spreadsMainLine, totalsMainLine, scores, winResult, penaltyShootout } =
        sportData;
    const disabled = !!ended || !!event.closed;
    const isEventEnded = !!sportData.ended || !!event.closed;

    // Derive tabs directly from market data (data-driven via sportsMarketType patterns)
    const tabs = useMemo(
        () => getSportMarketTabs(event.markets, homeTeam, awayTeam),
        [event.markets, homeTeam, awayTeam],
    );

    // Filter to tabs with non-empty sections
    const visibleTabs = useMemo(() => tabs.filter((tab) => tab.sections.some((s) => s.markets.length > 0)), [tabs]);

    const showTabBar = visibleTabs.length > 1;

    // Active tab state
    const [activeTabKey, setActiveTabKey] = useQueryState(
        'sport-tab',
        parseAsString.withOptions({ clearOnDefault: true }),
    );
    const activeTab = visibleTabs.find((t) => t.key === activeTabKey) ?? visibleTabs[0];

    // Build sections for active tab
    const sections = useMemo(
        () => buildSections(activeTab, { spreadsMainLine, totalsMainLine }),
        [activeTab, spreadsMainLine, totalsMainLine],
    );

    const chartConfig = useMemo<SportChartConfig>(() => {
        const allMoneyline = event.markets.filter((m) => m.sportsMarketType?.toLowerCase() === 'moneyline');
        const mergedMoneyline = allMoneyline[0];
        const chartMarkets = mergedMoneyline?.originalMoneylineMarkets || allMoneyline;
        return {
            moneylineMarkets: chartMarkets,
            isDraw,
            isEventEnded,
            endTime: event.endTime,
        };
    }, [event.markets, isDraw, isEventEnded, event.endTime]);

    const [activeKey, setActiveKey] = useQueryState('market', parseAsString.withOptions({ clearOnDefault: true }));
    const [line, setLine] = useQueryState('line', parseAsString.withOptions({ clearOnDefault: true }));
    const activeSectionKey = activeKey && sections.some((section) => section.key === activeKey) ? activeKey : undefined;

    return (
        <div className="flex flex-col gap-3 p-4">
            {showTabBar ? (
                <Tabs
                    value={activeTab.key}
                    onChange={setActiveTabKey}
                    className="border-b border-b-line"
                    variant="main"
                >
                    {visibleTabs.map((tab) => (
                        <Tab key={tab.key} value={tab.key}>
                            {tab.title}
                        </Tab>
                    ))}
                </Tabs>
            ) : null}
            {sections.map((section) => (
                <SportMarketGroupCard
                    key={section.key}
                    section={section}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    showDraw={isDraw}
                    platform={event.platform}
                    disabled={disabled}
                    active={section.key === activeSectionKey}
                    onActivate={() => {
                        if (activeSectionKey === section.key) {
                            void setActiveKey(null);
                            void setLine(null);
                        } else {
                            void setActiveKey(section.key);
                            void setLine(null);
                        }
                    }}
                    lineKey={section.key === activeSectionKey ? line : undefined}
                    onLineChange={setLine}
                    config={chartConfig}
                    eventSlug={event.slug}
                    scores={scores}
                    winResult={winResult}
                    penaltyShootout={penaltyShootout}
                />
            ))}
        </div>
    );
});
