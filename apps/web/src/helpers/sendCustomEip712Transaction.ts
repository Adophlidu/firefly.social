import { first } from 'lodash-es';
import { createPublicClient, http } from 'viem';
import { prepareTransactionRequest } from 'viem/actions';
import { type SendEip712TransactionParameters, signTransaction, type SignTransactionParameters } from 'viem/zksync';
import type { GetWalletClientReturnType } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';

export async function sendCustomEip712Transaction(
    chainId: number,
    parameters: Omit<SendEip712TransactionParameters, 'chain'> & {
        paymaster?: string;
        paymasterInput?: string;
    },
    options?: { rpcUrl?: string; client?: GetWalletClientReturnType },
) {
    const chain = wagmiConfig.chains.find((x) => x.id === chainId);
    if (!chain) throw new Error(`Not supported chain with chainId = ${chainId}`);

    const customRpcUrl = options?.rpcUrl || first(chain.rpcUrls?.default?.http);
    if (!customRpcUrl) throw new Error(`No rpc url found for chainId = ${chainId}`);

    const client = options?.client || (await getWalletClientRequired(wagmiConfig, { chainId }));
    if (!client.account.address) throw new Error('Wallet not connected.');

    // 1. prepare tx
    const txInfo = await prepareTransactionRequest(client, {
        ...parameters,
        nonceManager: client.account.nonceManager,
        parameters: ['gas', 'nonce', 'fees'],
    } as unknown as SendEip712TransactionParameters);

    // 2. sign tx
    const serializedTransaction = await signTransaction(client, {
        ...txInfo,
        chainId,
    } as unknown as SignTransactionParameters);

    // 3. send tx with custom rpc
    const publicClient = createPublicClient({ chain, transport: http(customRpcUrl) });
    return publicClient.sendRawTransaction({ serializedTransaction });
}
