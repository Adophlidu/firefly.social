import { type Eip1559TransactionRequest, type TxHash } from '@lens-protocol/client';
import { sendTransaction } from 'viem/zksync';

import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';

export async function sendSelfFundedTransaction(raw: Eip1559TransactionRequest): Promise<TxHash> {
    const walletClient = await getWalletClientForLensChain();

    return sendTransaction(walletClient, {
        account: walletClient.account,
        data: raw.data,
        gas: BigInt(raw.gasLimit),
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        nonce: raw.nonce,
        to: raw.to,
        value: BigInt(raw.value),
    }) as Promise<TxHash>;
}
