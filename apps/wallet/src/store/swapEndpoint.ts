import { envs } from '@dimensiondev/envs/wallet';
import { atom } from 'jotai';

import { SwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { store } from '@/store/index.js';

const swapEndpointAtom = atom((get) => {
    const token = get(fireflySessionTokenAtom);
    return new SwapEndpoint({
        baseURL: envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
});

export function getSwapEndpoint() {
    return store.get(swapEndpointAtom);
}
