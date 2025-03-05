import { AccountController } from '@reown/appkit';

import { appkit } from '@/configs/wagmiClient.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import type { ChainNamespace } from '@/types/index.js';

interface Options {
    address: string;
    namespace: ChainNamespace;
}

const fetchIdentity = memoizePromise(
    (address: string) => appkit.fetchIdentity({ address }),
    (address) => address,
);

export async function syncWalletIdentity({ address, namespace }: Options) {
    try {
        // packages/appkit/src/client.ts syncIdentity
        if (namespace !== 'eip155') throw new Error('Unsupported namespace');

        const { name, avatar } = await fetchIdentity(address);
        AccountController.setProfileImage(avatar || null, namespace);
        AccountController.setProfileName(name || null, namespace);
    } catch {
        AccountController.setProfileImage(null, namespace);
        AccountController.setProfileName(null, namespace);
    }
}
