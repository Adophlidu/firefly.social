/* cspell:disable */

export const LensHubABI = [
    {
        inputs: [
            { internalType: 'address', name: 'followNFTImpl', type: 'address' },
            { internalType: 'address', name: 'collectNFTImpl', type: 'address' },
            { internalType: 'address', name: 'moduleRegistry', type: 'address' },
            {
                internalType: 'uint256',
                name: 'tokenGuardianCooldown',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'lensHandlesAddress',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'tokenHandleRegistryAddress',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'legacyFeeFollowModule',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'legacyProfileFollowModule',
                        type: 'address',
                    },
                    {
                        internalType: 'address',
                        name: 'newFeeFollowModule',
                        type: 'address',
                    },
                ],
                internalType: 'struct Types.MigrationParams',
                name: 'migrationParams',
                type: 'tuple',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
];
