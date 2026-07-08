import type { PredictionPlatform } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';

import { pickWalletProfileByAddress } from '@/helpers/prediction/pickWalletProfileByAddress.js';
import { getWalletProfileInfoList } from '@/providers/firefly/prediction/getWalletProfileInfoList.js';

export function useProxyWalletInfo(platform: PredictionPlatform, proxyAddress: string) {
    return useQuery({
        queryKey: ['proxy-wallet-profile-info', proxyAddress, platform],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const res = await getWalletProfileInfoList(proxyAddress, platform, true);
            return pickWalletProfileByAddress(res, proxyAddress);
        },
    });
}
