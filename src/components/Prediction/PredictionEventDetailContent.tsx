import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';

import { PredictionBaseInfoTabContent } from '@/components/Prediction/PredictionBaseInfoTabContent.js';
import { PredictionBaseInfoTabs } from '@/components/Prediction/PredictionBaseInfoTabs.js';
import { PredictionEventOverview } from '@/components/Prediction/PredictionEventOverview.js';
import { PredictionMarketsAccountTab } from '@/components/Prediction/PredictionMarketsAccountTab/index.js';
import { PredictionMarketsPriceLineChart } from '@/components/Prediction/PredictionMarketsPriceLineChart/index.js';
import { PredictionProfilePageHeader } from '@/components/Prediction/PredictionProfilePageHeader.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { notFound } from '@/esm/navigation/server.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';

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

    const markets = detail.markets || EMPTY_LIST;
    const showResolution = markets.length === 1 && !!first(markets)?.statusList?.length;

    return (
        <div>
            <PredictionProfilePageHeader pageTitle={<Trans>Event detail</Trans>} />
            <PredictionEventOverview detail={detail} />
            <PredictionMarketsPriceLineChart platform={platform} markets={markets} />
            <PredictionMarketsAccountTab markets={markets} platform={platform} />
            <PredictionBaseInfoTabs showResolution={showResolution} />
            <PredictionBaseInfoTabContent showResolution={showResolution} platform={platform} detail={detail} />
        </div>
    );
}
