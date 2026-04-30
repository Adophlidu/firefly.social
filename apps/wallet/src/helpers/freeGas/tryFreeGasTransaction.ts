import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { isFreeGasSupportedChain } from '@dimensiondev/web3/chains';
import { isSupportedStablecoin, resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import type { Address } from 'viem';

import { withPinCodeCheck } from '@/helpers/withPinCodeCheck.js';
import { logger } from '@/lib/Logger.js';
import { type FreeGasTx, FreeGasTxType } from '@/providers/types/FreeGas.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface TryFreeGasParams {
    chainId: number;
    txType: FreeGasTxType;
    from: Address;
    to: Address;
    data: `0x${string}`;
    value?: string;
    tokenAddress?: string;
}
export type TryFreeGasResult = { type: 'free-gas'; hash: string } | { type: 'fallback' };

async function executeFreeGasTransaction(params: TryFreeGasParams, privyCodeHash?: string): Promise<TryFreeGasResult> {
    try {
        const { chainId, txType, from, to, data, value, tokenAddress } = params;

        if (!isFreeGasSupportedChain(chainId)) return { type: 'fallback' } as const;

        // Only token transfers are restricted to supported stablecoins
        if (txType === FreeGasTxType.TokenTransfer && !isSupportedStablecoin(chainId, tokenAddress ?? to)) {
            return { type: 'fallback' } as const;
        }

        const client = createWagmiPublicClient(chainId, resolvePublicRpcUrl(chainId));

        const txId = crypto.randomUUID();
        const nonce = await client.getTransactionCount({ address: from, blockTag: 'pending' });

        let gas: bigint;
        try {
            const estimated = await client.estimateGas({
                account: from,
                to,
                data,
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
            value: value ? `0x${BigInt(value).toString(16)}` : '0x0',
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
            privy_code_hash: privyCodeHash,
        });

        if (result.canFreeGas) {
            if (result.hash) {
                return { type: 'free-gas', hash: result.hash };
            } else {
                // Server confirmed free-gas eligibility but returned no hash — treat as error
                logger.error(`Free-gas accepted but no hash returned: ${result.failedReason || 'unknown'}`);
            }
        }

        return { type: 'fallback' };
    } catch {
        return { type: 'fallback' };
    }
}

export async function tryFreeGasTransaction(params: TryFreeGasParams): Promise<TryFreeGasResult> {
    return withPinCodeCheck((codeHash) => executeFreeGasTransaction(params, codeHash));
}
