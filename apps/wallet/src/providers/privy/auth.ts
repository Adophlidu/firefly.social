import { envs } from '@dimensiondev/envs/wallet';
import urlcat from 'urlcat';

import { resolvePrivyResponse } from '@/helpers/resolvePrivyResponse.js';
import { Fetch } from '@/lib/Fetch.js';
import type { CoinbaseAsset, CoinbaseBuyerToken, CoinbaseNetwork, PrivyResponse } from '@/providers/types/PrivyAuth.js';

class PrivyAuthApi extends Fetch {
    async getCoinbaseBuyerToken(buyerAddress: string, blockchain: CoinbaseNetwork, asset: CoinbaseAsset) {
        const result = await this.post<PrivyResponse<CoinbaseBuyerToken>>('/v1/funding/coinbase_on_ramp/init', {
            addresses: [
                {
                    address: buyerAddress,
                    blockchains: [blockchain],
                },
            ],
            assets: [asset],
        });
        return resolvePrivyResponse(result.data);
    }

    async getCoinbaseBuyerStatus(partnerUserId: string) {
        const result = await this.get<
            PrivyResponse<{
                status: 'pending' | string;
            }>
        >(
            urlcat('/v1/funding/coinbase_on_ramp/status', {
                partnerUserId,
            }),
        );
        return resolvePrivyResponse(result.data);
    }
}

export const privyAuthApi = new PrivyAuthApi({
    baseURL: 'https://auth.privy.io/api',
    headers: {
        'privy-app-id': envs.external.NEXT_PUBLIC_PRIVY_APP_ID,
    },
});
