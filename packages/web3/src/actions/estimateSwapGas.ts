import type { Address, Hex } from 'viem';
import type { Config } from 'wagmi';
import { estimateGas } from 'wagmi/actions';

// 2M is enough for any swap/approve; caps runaway estimates from misbehaving RPCs
const MAX_SWAP_GAS_LIMIT = 2_000_000n;
// Used when eth_estimateGas fails
const FALLBACK_GAS_LIMIT = 800_000n;

export async function estimateSwapGas(
    config: Config,
    params: {
        chainId: number;
        to: Address;
        data: Hex;
        value: bigint;
        account: Address;
    },
): Promise<bigint> {
    let gasLimit: bigint;
    try {
        gasLimit = await estimateGas(config, {
            chainId: params.chainId,
            to: params.to,
            data: params.data,
            value: params.value,
            account: params.account,
        });
    } catch (err) {
        console.warn('Gas estimation failed, using fallback', err);
        gasLimit = FALLBACK_GAS_LIMIT;
    }

    gasLimit = (gasLimit * 12n) / 10n;
    return gasLimit > MAX_SWAP_GAS_LIMIT ? MAX_SWAP_GAS_LIMIT : gasLimit;
}
