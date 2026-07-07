import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { parseUnits } from 'viem';
import { optimism } from 'viem/chains';
import { readContract } from 'wagmi/actions';

// The fallback config shares the optimism transport with the real config and
// needs no connectors for this read-only contract call, so callers (e.g. frame
// hosts on feed pages) never pull the heavy wallet stack into their chunk.
import { fallbackWagmiConfig } from '@/configs/wagmiFallbackClient.js';

const ABI = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
        ],
        name: 'custodyOf',
        outputs: [
            {
                internalType: 'address',
                name: 'custody',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Returns the custody address of a Farcaster ID.
 * Learn more: https://docs.farcaster.xyz/learn/architecture/contracts
 * @param fid - Farcaster ID
 * @returns
 */
export async function custodyOf(fid: string): Promise<string> {
    const address = await readContract(fallbackWagmiConfig, {
        abi: ABI,
        address: '0x00000000fc6c5f01fc30151999387bb99a9f489b',
        functionName: 'custodyOf',
        args: [parseUnits(fid, 0)],
        chainId: optimism.id,
    });
    if (!isValidAddressEthereum(address)) throw new Error(`Invalid custody address: ${address}`);
    return address;
}
