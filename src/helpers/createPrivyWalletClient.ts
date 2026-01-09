import { first } from 'lodash-es';
import { createClient, custom, getAddress, walletActions } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { privyEvmProviderSilent } from '@/connectors/PrivyConnector.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

interface Options {
    chainId: number;
}

export async function createPrivyWalletClient({ chainId }: Options) {
    const privyEvmAddress = first(useFireflyWalletStore.getState().wallets.ethereum)?.address;
    if (!privyEvmAddress) throw new Error('No Firefly wallet found for eth.');

    if (!useFireflyWalletStore.getState().isAuthorized) throw new Error('Firefly wallet is not authorized.');

    const chain = wagmiConfig.chains.find((x) => x.id === chainId);
    if (!chain) throw new Error(`Not supported chain with chainId = ${chainId}`);

    const client = createClient({
        chain,
        name: 'Privy Wallet Client',
        account: getAddress(privyEvmAddress),
        transport: (options) =>
            custom(privyEvmProviderSilent)({
                ...options,
                retryCount: 0,
            }),
    });
    const clientWithActions = client.extend(walletActions);

    await clientWithActions.switchChain({ id: chainId });

    return clientWithActions;
}
