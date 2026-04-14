import type { EthereumChainId } from '@/constants/ethereum.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import type { FreeGasTx, FreeGasTxType } from '@/providers/types/FreeGas.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface TryFreeGasParams {
    chainId: EthereumChainId;
    txType: FreeGasTxType;
    from: string;
    to: string;
    data: string;
    value?: string;
}

export async function tryFreeGasTransaction(
    params: TryFreeGasParams,
): Promise<{ type: 'free-gas'; hash: string } | { type: 'fallback' }> {
    try {
        const { chainId, txType, from, to, data, value } = params;
        const client = createWagmiPublicClient(chainId);

        const txId = crypto.randomUUID();
        const nonce = await client.getTransactionCount({ address: from as `0x${string}`, blockTag: 'pending' });

        let gas: bigint;
        try {
            const estimated = await client.estimateGas({
                account: from as `0x${string}`,
                to: to as `0x${string}`,
                data: data as `0x${string}`,
                value: value ? BigInt(value) : 0n,
            });
            gas = (estimated * 12n) / 10n;
        } catch {
            gas = 800000n;
        }

        const feeData = await client.estimateFeesPerGas();
        const tx: FreeGasTx = {
            data,
            from,
            gas: `0x${gas.toString(16)}`,
            to,
            value: value ?? '0x0',
        };

        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            tx.maxFeePerGas = `0x${feeData.maxFeePerGas.toString(16)}`;
            tx.maxPriorityFeePerGas = `0x${feeData.maxPriorityFeePerGas.toString(16)}`;
        } else {
            const gasPrice = await client.getGasPrice();
            tx.gasPrice = `0x${gasPrice.toString(16)}`;
        }

        const result = await getFireflyEndpoint().submitFreeGasTransaction({
            txId,
            chainId,
            txType,
            nonce,
            tx,
        });

        if (result.canFreeGas) {
            if (result.hash) {
                return { type: 'free-gas', hash: result.hash };
            }
            // Server confirmed free-gas eligibility but returned no hash — treat as error
            throw new Error(`Free-gas accepted but no hash returned: ${result.failedReason || 'unknown'}`);
        }

        return { type: 'fallback' };
    } catch (error) {
        // Re-throw if the server accepted free-gas but returned no hash — this is not a normal fallback
        if (error instanceof Error && error.message.startsWith('Free-gas accepted but no hash returned')) {
            throw error;
        }
        return { type: 'fallback' };
    }
}
