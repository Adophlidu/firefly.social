import type { Eip712TransactionRequest, TxHash } from '@lens-protocol/client';
import { lens } from 'viem/chains';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';

export async function sendSponsoredTransaction(raw: Eip712TransactionRequest): Promise<TxHash> {
    // Lazy so wagmiClient and the wagmi-backed web3 actions stay out of the static
    // graph reaching this module.
    const [{ wagmiConfig }, { sendCustomEip712Transaction }] = await Promise.all([
        loadWagmiClient(),
        import('@dimensiondev/web3/actions'),
    ]);
    const walletClient = await getWalletClientForLensChain();

    return sendCustomEip712Transaction(
        wagmiConfig,
        lens.id,
        {
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
        },
        { client: walletClient },
    ) as Promise<TxHash>;
}
