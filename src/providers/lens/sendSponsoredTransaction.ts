import type { Eip712TransactionRequest, TxHash } from '@lens-protocol/client';
import { sendEip712Transaction } from 'viem/zksync';

import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';

export async function sendSponsoredTransaction(raw: Eip712TransactionRequest): Promise<TxHash> {
    const walletClient = await getWalletClientForLensChain();

    return sendEip712Transaction(walletClient, {
        account: walletClient.account,
        data: raw.data,
        gas: BigInt(raw.gasLimit),
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        nonce: raw.nonce,
        paymaster: raw.customData.paymasterParams?.paymaster,
        paymasterInput: raw.customData.paymasterParams?.paymasterInput,
        to: raw.to,
        value: BigInt(raw.value),
    }) as Promise<TxHash>;
}
