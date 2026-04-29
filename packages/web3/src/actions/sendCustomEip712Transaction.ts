import { createPublicClient, http } from 'viem';
import { prepareTransactionRequest } from 'viem/actions';
import {
    chainConfig as zksyncChainConfig,
    type SendEip712TransactionParameters,
    signTransaction,
    type SignTransactionParameters,
} from 'viem/zksync';
import type { Config } from 'wagmi';
import { getWalletClient, type GetWalletClientReturnType } from 'wagmi/actions';

export async function sendCustomEip712Transaction(
    config: Config,
    chainId: number,
    parameters: Omit<SendEip712TransactionParameters, 'chain'> & {
        paymaster?: string;
        paymasterInput?: string;
    },
    options?: { rpcUrl?: string; client?: GetWalletClientReturnType; skipPrepare?: boolean },
) {
    const chain = config.chains.find((x) => x.id === chainId);
    if (!chain) throw new Error(`Not supported chain with chainId = ${chainId}`);

    const customRpcUrl = options?.rpcUrl || chain.rpcUrls?.default?.http[0];
    if (!customRpcUrl) throw new Error(`No rpc url found for chainId = ${chainId}`);

    const client = options?.client ?? (await getWalletClient(config, { chainId }));
    if (!client) throw new Error('Wallet not connected.');
    if (!client.account.address) throw new Error('Wallet not connected.');

    const txInfo = options?.skipPrepare
        ? (parameters as unknown as SendEip712TransactionParameters)
        : await prepareTransactionRequest(client, {
              ...parameters,
              nonceManager: client.account.nonceManager,
              parameters: ['gas', 'nonce', 'fees'],
          } as unknown as SendEip712TransactionParameters);

    // Merge zkSync chain config (getEip712Domain, serializers, formatters)
    // so signTransaction can sign EIP-712 transactions without calling unsupported RPC methods
    const zksyncChain = {
        ...chain,
        custom: { ...chain.custom, ...zksyncChainConfig.custom },
        serializers: { ...chain.serializers, ...zksyncChainConfig.serializers },
        formatters: { ...chain.formatters, ...zksyncChainConfig.formatters },
    };
    const signingClient = { ...client, chain: zksyncChain } as typeof client;

    const serializedTransaction = await signTransaction(signingClient, {
        ...txInfo,
        chainId,
        from: client.account.address,
    } as unknown as SignTransactionParameters);

    const publicClient = createPublicClient({ chain, transport: http(customRpcUrl) });
    return publicClient.sendRawTransaction({ serializedTransaction });
}
