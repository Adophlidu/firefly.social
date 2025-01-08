import { ChainId, EthereumMethodType } from '@masknet/web3-shared-evm';
import localforage from 'localforage';
import { type PublicClient, toHex } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import type { Chain } from '@/types/bridge.js';
import type { RequestArguments } from '@/types/ethereum.js';

const storage = localforage.createInstance({
    name: 'wagmi-mock-client',
});

export async function createWagmiMockClient() {
    const rawChainId = await storage.getItem<string>('chainId');
    const chainId = rawChainId ? (Number.parseInt(rawChainId, 16) as ChainId) : ChainId.Mainnet;

    const client = createWagmiPublicClient(chainId as ChainId);

    return {
        ...client,
        getChainId: () => Promise.resolve(chainId),
        request: async (requestArguments: RequestArguments) => {
            switch (requestArguments.method) {
                case EthereumMethodType.ETH_CHAIN_ID:
                    return Promise.resolve(chainId);
                case EthereumMethodType.WALLET_ADD_ETHEREUM_CHAIN:
                    const chain = requestArguments.params[0] as Chain;
                    await storage.setItem('chainId', toHex(chain.chainId));
                    return null;
                case EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN:
                    const newChainId = Number.parseInt(requestArguments.params[0] as string, 16);
                    if (chainId !== newChainId) await storage.setItem('chainId', newChainId);
                    return null;
                default:
                    return client.request(requestArguments as Parameters<typeof client.request>[0]);
            }
        },
    } as PublicClient;
}
