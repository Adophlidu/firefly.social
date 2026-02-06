import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';

// Client component for tracking
import { PolymarketEventTracker } from '@/components/Prediction/PolymarketEventTracker.js';
import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionContextProvider } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventOverview } from '@/components/Prediction/PredictionEventOverview.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { PredictionMarketsPriceLineChart } from '@/components/Prediction/PredictionMarketsPriceLineChart/index.js';
import { PredictionProfilePageHeader } from '@/components/Prediction/PredictionProfilePageHeader.js';
import { Locale, type PredictionPlatform } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { notFound } from '@/esm/navigation/server.js';
import { getLocaleFromCookies } from '@/helpers/getCookies.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { translateBetEventData } from '@/providers/prediction/translateBetEventData.js';

interface PredictionEventDetailContentProps {
    id: string;
    isMutil: boolean;
    platform: PredictionPlatform;
}

export async function PredictionEventDetailContent({ id, isMutil, platform }: PredictionEventDetailContentProps) {
    const [, detail] = await Promise.all([
        setupLocaleForSSR(),
        runInSafeAsync(() => getEventDetail(platform, { id, isMutil })),
    ]);
    if (!detail) notFound();

    const locale = await runInSafeAsync(() => getLocaleFromCookies());
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
    const isActive = event.markets.some((market) => !market.isClosed && !market.isResolved);

    return (
        <div className="pb-20">
            <PolymarketEventTracker platform={platform} eventSlug={id} detail={event} />
            <PredictionProfilePageHeader pageTitle={<Trans>Event detail</Trans>} />
            <PredictionEventOverview detail={event} isActive={isActive} />
            <PredictionMarketsPriceLineChart platform={platform} markets={markets} isActive={isActive} />
            <PredictionContextProvider platform={platform} markets={markets}>
                <PredictionMarketsAccountTab markets={markets} platform={platform} />
                <PredictionBaseInfoTabs showResolution={showResolution} eventSlug={id} />
                <PredictionBaseInfoTabContent showResolution={showResolution} platform={platform} detail={event} />
            </PredictionContextProvider>
        </div>
    );
}
