import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { type Chain, Network, SupportedMethod, type Transaction } from '@dimensiondev/native-bridge';
import { squashCallback } from '@dimensiondev/utils';
import { createInstance } from 'localforage';
import { toHex } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { type RequestArguments } from '@/types/ethereum.js';
import { EthereumChainId, EthereumMethodType } from '@/web3-shared/evm/types.js';

const storage = createInstance({
    name: 'wagmi-limited-client',
});

const connectWalletSquashed = squashCallback(
    () =>
        nativeBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
            type: Network.EVM,
        }),
    {
        resolver: () => 'connect-wallet',
    },
);

async function createClient() {
    const rawChainId = await storage.getItem<string>('chainId');
    const chainId = rawChainId ? (Number.parseInt(rawChainId, 16) as EthereumChainId) : EthereumChainId.Mainnet;
    return createWagmiPublicClient(chainId);
}

function isValidChainId(chainId: number) {
    return !Number.isNaN(chainId) && Number.isInteger(chainId) && chainId > 0;
}

export async function createFireflyWalletClient() {
    return {
        getChainId: async () => {
            const client = await createClient();
            return client.getChainId();
        },
        request: async (requestArguments: RequestArguments) => {
            const client = await createClient();
            const chainId = await client.getChainId();

            switch (requestArguments.method) {
                case EthereumMethodType.FIREFLY_FRAME_SWITCH_WALLET: {
                    const account = await connectWalletSquashed();
                    await storage.setItem('account', account);
                    return [account];
                }
                case EthereumMethodType.ETH_ACCOUNTS:
                case EthereumMethodType.ETH_REQUEST_ACCOUNTS: {
                    const accountFromStore = await storage.getItem<string>('account');
                    if (accountFromStore) return [accountFromStore];

                    const accounts = await nativeBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                        type: Network.EVM,
                    });
                    if (accounts.length) return accounts;

                    const account = await connectWalletSquashed();
                    return [account];
                }
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
                case EthereumMethodType.ETH_SIGN:
                case EthereumMethodType.PERSONAL_SIGN: {
                    const [message, address] = requestArguments.params as [string, string];
                    const signed = await nativeBridgeProvider.request(SupportedMethod.SIGN_MESSAGE, {
                        chainId: toHex(chainId),
                        address,
                        message,
                    });
                    return signed;
                }
                case EthereumMethodType.ETH_SIGN_TYPED_DATA: {
                    const [address, data] = requestArguments.params as [string, {} | string];
                    const signed = await nativeBridgeProvider.request(SupportedMethod.SIGN_TYPED_DATA, {
                        chainId: toHex(chainId),
                        address,
                        message: typeof data === 'string' ? data : JSON.stringify(data),
                    });
                    return signed;
                }
                case EthereumMethodType.ETH_SIGN_TRANSACTION: {
                    const transaction = requestArguments.params[0] as Transaction;
                    const hash = await nativeBridgeProvider.request(SupportedMethod.SIGN_TRANSACTION, {
                        chainId: toHex(chainId),
                        transaction,
                    });
                    return hash;
                }
                case EthereumMethodType.ETH_SEND_TRANSACTION: {
                    const transaction = requestArguments.params[0] as Transaction;
                    const hash = await nativeBridgeProvider.request(SupportedMethod.SEND_TRANSACTION, {
                        chainId: toHex(chainId),
                        transaction,
                    });
                    return hash;
                }
                default:
                    return client.request(requestArguments as Parameters<typeof client.request>[0]);
            }
        },
    };
}
