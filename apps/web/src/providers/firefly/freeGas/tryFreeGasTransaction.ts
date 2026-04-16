import { isSupportedStablecoin } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { logger } from '@/libs/Logger.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

export enum FreeGasTxType {
    TokenApprove = 'token_approve',
    PolymarketDeposit = 'polymarket_deposit',
    RedpacketSend = 'redpacket_send',
    TokenTransfer = 'token_transfer',
}

export interface FreeGasTx {
    data: string;
    from: string;
    gas: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    to: string;
    value: string;
}

export interface FreeGasRequestBody {
    txId: string;
    chainId: number;
    txType: FreeGasTxType;
    nonce: number;
    tx: FreeGasTx;
}

interface FreeGasResponse {
    canFreeGas: boolean;
    hash: string;
    failedReason: string;
}

interface FireflyResponse<T> {
    code: number;
    data?: T;
    error?: string[];
}

export interface TryFreeGasParams {
    chainId: EthereumChainId;
    txType: FreeGasTxType;
    from: string;
    to: string;
    data: string;
    value?: string;
    tokenAddress?: string;
}

export async function tryFreeGasTransaction(
    params: TryFreeGasParams,
): Promise<{ type: 'free-gas'; hash: string } | { type: 'fallback' }> {
    try {
        const { chainId, txType, from, to, data, value, tokenAddress } = params;

        // Only attempt free-gas for supported stablecoins
        if (!isSupportedStablecoin(chainId, tokenAddress ?? to)) {
            return { type: 'fallback' } as const;
        }

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
            value: value ? `0x${BigInt(value).toString(16)}` : '0x0',
        };

        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            tx.maxFeePerGas = `0x${feeData.maxFeePerGas.toString(16)}`;
            tx.maxPriorityFeePerGas = `0x${feeData.maxPriorityFeePerGas.toString(16)}`;
        } else {
            const gasPrice = await client.getGasPrice();
            tx.gasPrice = `0x${gasPrice.toString(16)}`;
        }

        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/privy/tx/free-gas');
        const result = await fireflySessionHolder.fetchWithSession<FireflyResponse<FreeGasResponse>>(url, {
            method: 'POST',
            body: JSON.stringify({ txId, chainId, txType, nonce, tx }),
        });

        if (result.data?.canFreeGas) {
            if (result.data.hash) {
                return { type: 'free-gas', hash: result.data.hash };
            } else {
                // Server confirmed free-gas eligibility but returned no hash — treat as error
                logger.error(`Free-gas accepted but no hash returned: ${result.data.failedReason || 'unknown'}`);
            }
        }

        return { type: 'fallback' };
    } catch {
        return { type: 'fallback' };
    }
}
