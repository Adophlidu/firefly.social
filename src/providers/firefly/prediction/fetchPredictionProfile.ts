import { safeUnreachable } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import { formatOpinionProfile, formatPolymarketProfile } from '@/components/Prediction/formatPredictionProfile.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getPredictionPnlHistory } from '@/providers/firefly/prediction/getPredictionPnlHistory.js';
import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';
import { getProfile } from '@/providers/firefly/prediction/getProfile.js';
import { getUserStats } from '@/providers/prediction/polymarket/getUserStats.js';
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
                if (!profile) return;

                const [pnlHistory, largestWin] = await Promise.all([
                    runInSafeAsync(() => getPredictionPnlHistory(profile.proxy, platform)),
                    runInSafeAsync(() => getUserStats(profile.proxy)),
                ]);

                return {
                    ...profile,
                    pnl_history: pnlHistory,
                    largest_win: largestWin,
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
