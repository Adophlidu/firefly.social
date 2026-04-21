import { createPublicClient, http } from 'viem';
import { prepareTransactionRequest } from 'viem/actions';
import { type SendEip712TransactionParameters, signTransaction, type SignTransactionParameters } from 'viem/zksync';
import type { Config } from 'wagmi';
import { getWalletClient, type GetWalletClientReturnType } from 'wagmi/actions';

export async function sendCustomEip712Transaction(
    config: Config,
    chainId: number,
    parameters: Omit<SendEip712TransactionParameters, 'chain'> & {
        paymaster?: string;
        paymasterInput?: string;
    },
    options?: { rpcUrl?: string; client?: GetWalletClientReturnType },
) {
    const chain = config.chains.find((x) => x.id === chainId);
    if (!chain) throw new Error(`Not supported chain with chainId = ${chainId}`);

    const customRpcUrl = options?.rpcUrl || chain.rpcUrls?.default?.http[0];
    if (!customRpcUrl) throw new Error(`No rpc url found for chainId = ${chainId}`);

    const client = options?.client ?? (await getWalletClient(config, { chainId }));
    if (!client) throw new Error('Wallet not connected.');
    if (!client.account.address) throw new Error('Wallet not connected.');

    const txInfo = await prepareTransactionRequest(client, {
        ...parameters,
        nonceManager: client.account.nonceManager,
        parameters: ['gas', 'nonce', 'fees'],
    } as unknown as SendEip712TransactionParameters);

    const serializedTransaction = await signTransaction(client, {
        ...txInfo,
        chainId,
    } as unknown as SignTransactionParameters);

    const publicClient = createPublicClient({ chain, transport: http(customRpcUrl) });
    return publicClient.sendRawTransaction({ serializedTransaction });
}
