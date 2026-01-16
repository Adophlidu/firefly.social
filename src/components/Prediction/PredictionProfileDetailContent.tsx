import { safeUnreachable } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { formatOpinionProfile, formatPolymarketProfile } from '@/components/Prediction/formatPredictionProfile.js';
import { PredictionProfileCategoryTabs } from '@/components/Prediction/PredictionProfileCategoryTabs.js';
import { PredictionProfileOverview } from '@/components/Prediction/PredictionProfileOverview.js';
import { PredictionProfilePageHeader } from '@/components/Prediction/PredictionProfilePageHeader.js';
import { PredictionProfileTabContent } from '@/components/Prediction/PredictionProfileTabContent.js';
import { BetsPlatform } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';
import { getProfile } from '@/providers/firefly/prediction/getProfile.js';

interface Props {
    address: string;
    platform: BetsPlatform;
}

export async function PredictionProfileDetailContent({ address, platform }: Props) {
    if (!address || !isValidAddressEthereum(address)) notFound();

    const [, betsProfile] = await Promise.all([
        setupLocaleForSSR(),
        runInSafeAsync(async () => {
            switch (platform) {
                case BetsPlatform.Polymarket: {
                    const profile = await getProfile(address, true);
                    return profile ? formatPolymarketProfile(profile) : undefined;
                }
                case BetsPlatform.Opinion: {
                    const res = await getPredictionPortfolio([address], {
                        isProxyAddress: true,
                        platform: BetsPlatform.Opinion,
                    });
                    const profile = first(res?.result);
                    return profile ? formatOpinionProfile(profile) : undefined;
                }
                default:
                    safeUnreachable(platform);
                    return;
            }
        }),
    ]);

    if (!betsProfile) notFound();

    return (
        <div>
            <PredictionProfilePageHeader />
            <PredictionProfileOverview address={address} profile={betsProfile} platform={platform} />
            <PredictionProfileCategoryTabs />
            <PredictionProfileTabContent platform={platform} address={address} proxyAddress={betsProfile?.proxy} />
        </div>
    );
}
