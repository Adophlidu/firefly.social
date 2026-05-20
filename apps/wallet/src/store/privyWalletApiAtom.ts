import { env } from '@dimensiondev/envs/wallet';
import { atom } from 'jotai';

import { PrivyWalletApi } from '@/providers/firefly/privyWallet.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { store } from '@/store/index.js';

const privyWalletApiAtom = atom((get) => {
    const token = get(fireflySessionTokenAtom);

    return new PrivyWalletApi({
        baseURL: env.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
        headers: token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : undefined,
    });
});

export function getPrivyWalletApi() {
    return store.get(privyWalletApiAtom);
}
