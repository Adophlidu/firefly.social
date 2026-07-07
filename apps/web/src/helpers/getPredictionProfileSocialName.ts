import type { PredictionPlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';

import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { getWalletProfileInfoList } from '@/providers/firefly/prediction/getWalletProfileInfoList.js';

export async function getPredictionProfileSocialName(address: string, platform: PredictionPlatform) {
    return runInSafeAsync(async () => {
        const response = await getWalletProfileInfoList(address, platform, true);
        const firstEntry = first(response?.data?.walletAddress);
        if (!firstEntry) return undefined;

        for (const key in firstEntry) {
            if (isSameEthereumAddress(key, address)) {
                return extractFallbackInfo(firstEntry[key]).name;
            }
        }

        return undefined;
    });
}
