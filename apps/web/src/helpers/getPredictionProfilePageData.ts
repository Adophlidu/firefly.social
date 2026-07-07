import { PredictionPlatform } from '@dimensiondev/enums';
import { runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { cache } from 'react';

import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';
import { getProfile } from '@/providers/firefly/prediction/getProfile.js';
import type { BetPortfolioItem } from '@/providers/types/Firefly.js';

type PredictionProfileMetadataSource = Pick<BetPortfolioItem, 'wallet' | 'proxy' | 'platform_name'>;

export const getPredictionProfilePageData = cache(
    async (address: string, platform: PredictionPlatform): Promise<PredictionProfileMetadataSource | null> => {
        return (
            (await runInSafeAsync(async () => {
                switch (platform) {
                    case PredictionPlatform.Polymarket: {
                        const data = await getProfile(address, true);
                        if (!data) return null;

                        return {
                            wallet: data.wallet,
                            proxy: data.proxy,
                            platform_name: data.platform_name,
                        };
                    }
                    case PredictionPlatform.Opinion: {
                        const response = await getPredictionPortfolio([address], {
                            isProxyAddress: false,
                            platform,
                        });
                        const profile = first(response?.result);
                        if (!profile) return null;

                        return {
                            wallet: profile.wallet,
                            proxy: profile.proxy,
                            platform_name: profile.platform_name,
                        };
                    }
                    default:
                        safeUnreachable(platform);
                        return null;
                }
            })) ?? null
        );
    },
);
