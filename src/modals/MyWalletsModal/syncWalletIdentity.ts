import { AccountController } from '@reown/appkit';
import { mainnet } from 'viem/chains';

import { appkit } from '@/configs/appkit.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import type { ChainNamespace } from '@/types/utility.js';

interface Options {
    address: string;
    namespace: ChainNamespace;
}

const fetchIdentity = memoizePromise(
    (address: string) => appkit.fetchIdentity({ address, caipNetworkId: `eip155:${mainnet.id}` }),
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
