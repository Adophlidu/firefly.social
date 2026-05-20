import { envs } from '@dimensiondev/envs/wallet';
import { atom } from 'jotai';

import { FireflyEndpoint } from '@/providers/firefly/endpoint.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { store } from '@/store/index.js';

const fireflyEndpointAtom = atom((get) => {
    const token = get(fireflySessionTokenAtom);
    if (token) {
        return new FireflyEndpoint({
            baseURL: envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }
    return new FireflyEndpoint({
        baseURL: envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
    });
});

export function getFireflyEndpoint() {
    return store.get(fireflyEndpointAtom);
}
