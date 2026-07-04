import { EMPTY_LIST } from '@dimensiondev/constants';
import type { PredictionPlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { EventSeriesPills } from '@/components/Prediction/EventSeriesPills/index.js';
import { PolymarketEventTracker } from '@/components/Prediction/PolymarketEventTracker.js';
import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventOverview } from '@/components/Prediction/PredictionEventOverview.js';
import { PredictionEventPageHeader } from '@/components/Prediction/PredictionEventPageHeader.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { PredictionSingleChart } from '@/components/Prediction/PredictionSingleChart/index.js';
import { SportEventDetailContent } from '@/components/Prediction/Sport/SportEventDetailContent.js';
import { SportEventPageTitle } from '@/components/Prediction/Sport/SportEventPageTitle.js';
import { SuperfortuneEntry } from '@/components/Prediction/Superfortune/SuperfortuneEntry.js';
import { notFound } from '@/esm/navigation/server.js';
import { shouldShowSuperfortuneEntry } from '@/helpers/prediction/superfortune.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { setupLocaleFromParams } from '@/i18n/static.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PredictionEventDetailContentProps {
    id: string;
    isMutil: boolean;
    locale: string;
    platform: PredictionPlatform;
    event?: BetsEventDataForUI;
}

export async function PredictionEventDetailContent({
    event: initialEvent,
    id,
    isMutil,
    locale,
    platform,
}: PredictionEventDetailContentProps) {
    setupLocaleFromParams(locale); // Ensure i18n is set for <Trans> in this server component
    const resolvedLocale = resolveLocale(locale);
    const event =
        initialEvent ?? (await runInSafeAsync(() => getEventDetail(platform, { id, isMutil, locale: resolvedLocale })));
    if (!event) notFound();

    const markets = event.markets || EMPTY_LIST;
    const showResolution = markets.length === 1 && !!markets[0]?.statusList?.length;
    const eventSlug = id || event.id;
    const eventTitle = event.title;
    const series = event.series?.[0];
    const sportPageTitle = event.sportData ? (
        <SportEventPageTitle
            homeName={event.sportData.homeTeam.name}
            homeAbbreviation={event.sportData.homeTeam.abbreviation}
            awayName={event.sportData.awayTeam.name}
            awayAbbreviation={event.sportData.awayTeam.abbreviation}
        />
    ) : null;

    return (
        <div className="pb-20">
            <PolymarketEventTracker platform={platform} eventSlug={id} tags={event.tags} />
            <PredictionEventPageHeader
                pageTitle={sportPageTitle || <Trans>Event detail</Trans>}
                action={
                    shouldShowSuperfortuneEntry(event) ? (
                        <SuperfortuneEntry matchKey={eventSlug} locale={resolvedLocale} />
                    ) : null
                }
            />
            {event.sportData ? (
                <SportEventDetailContent event={event} locale={resolvedLocale} />
            ) : (
                <PredictionContextProvider event={event} locale={resolvedLocale}>
                    <PredictionEventOverview />
                    <PredictionSingleChart />
                    {series?.recurrence ? <EventSeriesPills currentEvent={event} series={series} /> : null}
                    <PredictionMarketsAccountTab eventSlug={id} platform={platform} />
                    <PredictionBaseInfoTabs showResolution={showResolution} eventSlug={eventSlug} />
                    <PredictionBaseInfoTabContent
                        showResolution={showResolution}
                        platform={platform}
                        eventSlug={eventSlug}
                        eventTitle={eventTitle}
                    />
                </PredictionContextProvider>
            )}
        </div>
    );
}
