import { safeUnreachable } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { formatOpinionProfile, formatPolymarketProfile } from '@/components/Prediction/formatPredictionProfile.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getPredictionPnlHistory } from '@/providers/firefly/prediction/getPredictionPnlHistory.js';
import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';
import { getProfile } from '@/providers/firefly/prediction/getProfile.js';
import { type PredictionProfileDataForUI } from '@/types/prediction.js';

export async function fetchPredictionProfile(
    address: string,
    platform: PredictionPlatform,
    isProxyAddress?: boolean,
): Promise<PredictionProfileDataForUI | undefined> {
    return runInSafeAsync(async () => {
        switch (platform) {
            case PredictionPlatform.Polymarket: {
                const profileData = await getProfile(address, true);
                const profile = profileData ? formatPolymarketProfile(profileData) : undefined;
                const pnlHistory = profile ? await getPredictionPnlHistory(profile.proxy, platform) : undefined;

                return {
                    ...profile,
                    pnl_history: pnlHistory,
                } as PredictionProfileDataForUI;
            }
            case PredictionPlatform.Opinion: {
                const res = await getPredictionPortfolio([address], {
                    isProxyAddress,
                    platform,
                });
                const profileData = first(res?.result);
                const profile = profileData ? formatOpinionProfile(profileData) : undefined;
                return profile;
            }
            default:
                safeUnreachable(platform);
                return;
        }
    });
}
