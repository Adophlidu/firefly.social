import { isSameEthereumAddress } from '@dimensiondev/web3-utils';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';

import type { PredictionPlatform } from '@/constants/enum.js';
import { getWalletProfileInfoList } from '@/providers/firefly/prediction/getWalletProfileInfoList.js';

export function useProxyWalletInfo(platform: PredictionPlatform, proxyAddress: string) {
    return useQuery({
        queryKey: ['proxy-wallet-profile-info', proxyAddress, platform],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const res = await getWalletProfileInfoList(proxyAddress, platform, true);
            const walletAddresses = res?.data?.walletAddress;
            if (!walletAddresses || walletAddresses.length === 0) return null;
            const firstEntry = first(walletAddresses);
            if (!firstEntry) return null;

            for (const key in firstEntry) {
                if (isSameEthereumAddress(key, proxyAddress)) return firstEntry[key];
            }

            return null;
        },
    });
}
