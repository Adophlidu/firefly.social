import { atom } from 'jotai';

import { FIREFLY_ROOT_URL, FIREFLY_ROOT_URL_DEV } from '@/constants/static';
import { FireflySessionHolder } from '@/providers/fireflySessionHolder';
import { store } from '@/store/index';
import { apiModeAtom, sessionTokenAtom } from '@/store/session';

const fireflyEndpointAtom = atom((get) => {
    const token = get(sessionTokenAtom);
    const apiMode = get(apiModeAtom);

    return new FireflySessionHolder(token ?? undefined, apiMode === 'dev' ? FIREFLY_ROOT_URL_DEV : FIREFLY_ROOT_URL);
});

export function getFireflyEndpoint() {
    return store.get(fireflyEndpointAtom);
}
