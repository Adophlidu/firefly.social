import type { Eip712TransactionRequest, TxHash } from '@lens-protocol/client';
import { lens } from 'viem/chains';

import { sendCustomEip712Transaction } from '@/helpers/sendCustomEip712Transaction.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';

export async function sendSponsoredTransaction(raw: Eip712TransactionRequest): Promise<TxHash> {
    const walletClient = await getWalletClientForLensChain();

    return sendCustomEip712Transaction(lens.id, {
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
