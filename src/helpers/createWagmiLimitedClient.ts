import { createInstance } from 'localforage';
import { toHex } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import type { Chain } from '@/types/bridge.js';
import type { RequestArguments } from '@/types/ethereum.js';
import { EthereumChainId, EthereumMethodType } from '@/web3-shared/evm/types.js';

const storage = createInstance({
    name: 'wagmi-limited-client',
});

async function createClient() {
    const rawChainId = await storage.getItem<string>('chainId');
    const chainId = rawChainId ? (Number.parseInt(rawChainId, 16) as EthereumChainId) : EthereumChainId.Mainnet;
    return createWagmiPublicClient(chainId);
}

function isValidChainId(chainId: number) {
    return !Number.isNaN(chainId) && Number.isInteger(chainId) && chainId > 0;
}

export async function createWagmiLimitedClient() {
    return {
        getChainId: async () => {
            const client = await createClient();
            return client.getChainId();
        },
        request: async (requestArguments: RequestArguments) => {
            const client = await createClient();
            const chainId = await client.getChainId();

            switch (requestArguments.method) {
                case EthereumMethodType.ETH_CHAIN_ID:
                    return toHex(chainId);
                case EthereumMethodType.WALLET_ADD_ETHEREUM_CHAIN:
                case EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN: {
                    const chain = requestArguments.params[0] as Chain;
                    const newChainId = Number.parseInt(chain.chainId, 16);
                    if (!isValidChainId(newChainId)) throw new Error('Invalid chain ID');
                    if (chainId !== newChainId) await storage.setItem('chainId', chain.chainId);
                    return null;
                }
                default:
                    return client.request(requestArguments as Parameters<typeof client.request>[0]);
            }
        },
    };
}
