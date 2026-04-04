import { pad, parseUnits } from 'viem';
import { readContract } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

const ABI = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'fid',
                type: 'uint256',
            },
            {
                internalType: 'bytes',
                name: 'key',
                type: 'bytes',
            },
        ],
        name: 'keyDataOf',
        outputs: [
            {
                components: [
                    {
                        internalType: 'enum IKeyRegistry.KeyState',
                        name: 'state',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint32',
                        name: 'keyType',
                        type: 'uint32',
                    },
                ],
                internalType: 'struct IKeyRegistry.KeyData',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export async function keyDataOf(fid: number, address: `0x${string}`) {
    const result = await readContract(wagmiConfig, {
        abi: ABI,
        address: '0x00000000fc1237824fb747abde0ff18990e59b7e',
        functionName: 'keyDataOf',
        args: [parseUnits(`${fid}`, 0), pad(address, { size: 32 })],
        chainId: EthereumChainId.Optimism,
    });

    // result may already be an object with properties, depending on ethers.js version
    return result;
}
