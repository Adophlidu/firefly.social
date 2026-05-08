import { EMPTY_LIST } from '@dimensiondev/constants';
import { runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';

// Client component for tracking
import { PolymarketEventTracker } from '@/components/Prediction/PolymarketEventTracker.js';
import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventOverview } from '@/components/Prediction/PredictionEventOverview.js';
import { PredictionEventPageHeader } from '@/components/Prediction/PredictionEventPageHeader.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { PredictionSeries } from '@/components/Prediction/PredictionSeries/index.js';
import { PredictionSingleChart } from '@/components/Prediction/PredictionSingleChart/index.js';
import { Locale, type PredictionPlatform } from '@/constants/enum.js';
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
    const showResolution = markets.length === 1 && !!first(markets)?.statusList?.length;
    const eventSlug = id || event.id;
    const eventTitle = event.title;
    const series = first(event.series || []);

    return (
        <div className="pb-20">
            <PolymarketEventTracker platform={platform} eventSlug={id} detail={event} />
            <PredictionEventPageHeader pageTitle={<Trans>Event detail</Trans>} />
            <PredictionContextProvider event={event} translatedEvent={translatedEvent}>
                <PredictionEventOverview />
                <PredictionSingleChart />
                {series?.recurrence ? (
                    <PredictionSeries
                        platform={platform}
                        id={series.id}
                        recurrence={series.recurrence}
                        eventSlug={eventSlug}
                    />
                ) : null}
                <PredictionMarketsAccountTab eventSlug={id} platform={platform} />
                <PredictionBaseInfoTabs showResolution={showResolution} eventSlug={eventSlug} />
                <PredictionBaseInfoTabContent
                    showResolution={showResolution}
                    platform={platform}
                    eventSlug={eventSlug}
                    eventTitle={eventTitle}
                />
            </PredictionContextProvider>
        </div>
    );
}
