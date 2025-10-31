/* cspell:disable */
export const ParagraphABI = [
    {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'address', name: 'mintReferrer', type: 'address' },
        ],
        name: 'mintWithReferrer',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export const ParagraphMintABI = [
    {
        inputs: [{ internalType: 'address', name: '_feeManagerImplementation', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [
            {
                components: [
                    { internalType: 'string', name: 'name_', type: 'string' },
                    { internalType: 'string', name: 'symbol_', type: 'string' },
                    { internalType: 'address', name: 'ownerAddr', type: 'address' },
                    { internalType: 'address', name: 'minterAddr', type: 'address' },
                    { internalType: 'address', name: 'creatorReferrerAddr', type: 'address' },
                    { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
                    { internalType: 'uint256', name: 'priceWei', type: 'uint256' },
                ],
                internalType: 'struct ERC721Factory.MintData',
                name: 'mintData',
                type: 'tuple',
            },
            { internalType: 'address', name: 'mintReferrerAddress', type: 'address' },
            { internalType: 'string', name: 'postId', type: 'string' },
            { internalType: 'uint256', name: 'from', type: 'uint256' },
            { internalType: 'uint256', name: 'to', type: 'uint256' },
        ],
        name: 'createAndMint',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'payable',
        type: 'function',
    },
];
