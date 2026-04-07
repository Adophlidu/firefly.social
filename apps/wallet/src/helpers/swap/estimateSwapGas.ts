import { type Address, type Hex } from 'viem';
import { estimateGas } from 'wagmi/actions';

import { config } from '@/configs/wagmi.js';
import { logger } from '@/lib/Logger.js';

// 2M is enough for any swap/approve; caps runaway estimates from misbehaving RPCs
const MAX_SWAP_GAS_LIMIT = 2_000_000n;
// Used when eth_estimateGas fails
const FALLBACK_GAS_LIMIT = 800_000n;

// Estimate gas for a swap/approve tx via RPC:
// uses eth_estimateGas, adds 20% buffer, caps at MAX.
export async function estimateSwapGas(params: {
    chainId: number;
    to: Address;
    data: Hex;
    value: bigint;
    account: Address;
}): Promise<bigint> {
    let gasLimit: bigint;
    try {
        gasLimit = await estimateGas(config, {
            chainId: params.chainId as (typeof config)['chains'][number]['id'],
            to: params.to,
            data: params.data,
            value: params.value,
            account: params.account,
        });
    } catch (err) {
        logger.warn('Gas estimation failed, using fallback', err);
        gasLimit = FALLBACK_GAS_LIMIT;
    }

    gasLimit = (gasLimit * 12n) / 10n;
    return gasLimit > MAX_SWAP_GAS_LIMIT ? MAX_SWAP_GAS_LIMIT : gasLimit;
}
