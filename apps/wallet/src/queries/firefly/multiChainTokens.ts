import { compact } from 'lodash-es';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getMultiChainTokensQuery(addresses: string[], chains: number[]) {
    return {
        queryKey: ['multi-chain-token', ...compact(addresses.map((addr) => addr?.toLowerCase())), ...chains],
        async queryFn() {
            return getFireflyEndpoint().getMultiChainTokenList(addresses, chains);
        },
        enabled: addresses.length > 0 && chains.length > 0,
    };
}
