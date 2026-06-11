import { EMPTY_LIST } from '@dimensiondev/constants';
import type { PredictionPlatform } from '@dimensiondev/enums';
import { Locale } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { EventSeriesPills } from '@/components/Prediction/EventSeriesPills/index.js';
// Client component for tracking
import { PolymarketEventTracker } from '@/components/Prediction/PolymarketEventTracker.js';
import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventOverview } from '@/components/Prediction/PredictionEventOverview.js';
import { PredictionEventPageHeader } from '@/components/Prediction/PredictionEventPageHeader.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { PredictionSingleChart } from '@/components/Prediction/PredictionSingleChart/index.js';
import { SportEventDetailContent } from '@/components/Prediction/Sport/SportEventDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { setupLocaleFromParams } from '@/i18n/static.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { translateBetEventData } from '@/providers/prediction/translateBetEventData.js';

interface PredictionEventDetailContentProps {
    id: string;
    isMutil: boolean;
    platform: PredictionPlatform;
}

export async function PredictionEventDetailContent({ id, isMutil, platform }: PredictionEventDetailContentProps) {
    setupLocaleFromParams(Locale.en); // Ensure i18n is set for <Trans> in this server component
    const detail = await runInSafeAsync(() => getEventDetail(platform, { id, isMutil }));
    if (!detail) notFound();

    const { getI18n } = await import('@lingui/react/server');
    const i18nInstance = getI18n();
    const locale = (i18nInstance && 'locale' in i18nInstance ? i18nInstance.locale : undefined) as Locale | undefined;
    const translatedEvent = await runInSafeAsync(() =>
        translateBetEventData({
            platform,
            event: detail,
            locale: locale || Locale.en,
        }),
    );

    const event = translatedEvent || detail;
    const markets = event.markets || EMPTY_LIST;
    const showResolution = markets.length === 1 && !!markets[0]?.statusList?.length;
    const eventSlug = id || event.id;
    const eventTitle = event.title;
    const series = event.series?.[0];
    const sportPageTitle =
        event.title ??
        (event.sportData
            ? `${event.sportData.homeTeam.name || event.sportData.homeTeam.abbreviation || 'Home'} vs ${
                  event.sportData.awayTeam.name || event.sportData.awayTeam.abbreviation || 'Away'
              }`
            : null);

    return (
        <div className="pb-20">
            <PolymarketEventTracker platform={platform} eventSlug={id} detail={event} />
            <PredictionEventPageHeader pageTitle={sportPageTitle || <Trans>Event detail</Trans>} />
            {event.sportData ? (
                <SportEventDetailContent event={event} />
            ) : (
                <PredictionContextProvider event={event} translatedEvent={translatedEvent}>
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
