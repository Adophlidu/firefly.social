/* cspell:disable */
export const MirrorABI = [
    {
        stateMutability: 'nonpayable',
        type: 'constructor',
        inputs: [
            {
                name: '_factory',
                internalType: 'address',
                type: 'address',
            },
            {
                name: '_treasuryConfiguration',
                internalType: 'address',
                type: 'address',
            },
            {
                name: '_o11y',
                internalType: 'address',
                type: 'address',
            },
        ],
    },
    {
        stateMutability: 'view',
        type: 'function',
        inputs: [
            {
                name: 'owner',
                internalType: 'address',
                type: 'address',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                internalType: 'uint256',
                type: 'uint256',
            },
        ],
    },
    {
        stateMutability: 'payable',
        type: 'function',
        inputs: [
            {
                name: 'tokenRecipient',
                internalType: 'address',
                type: 'address',
            },
            {
                name: 'message',
                internalType: 'string',
                type: 'string',
            },
            {
                name: 'mintReferral',
                internalType: 'address',
                type: 'address',
            },
        ],
        name: 'purchase',
        outputs: [
            {
                name: 'tokenId',
                internalType: 'uint256',
                type: 'uint256',
            },
        ],
    },
];

export const OldMirrorABI = [
    {
        stateMutability: 'nonpayable',
        type: 'constructor',
        inputs: [
            {
                name: '_factory',
                internalType: 'address',
                type: 'address',
            },
            {
                name: '_treasuryConfiguration',
                internalType: 'address',
                type: 'address',
            },
            {
                name: '_o11y',
                internalType: 'address',
                type: 'address',
            },
        ],
    },
    {
        stateMutability: 'payable',
        type: 'function',
        inputs: [
            {
                name: 'tokenRecipient',
                internalType: 'address',
                type: 'address',
            },
            {
                name: 'message',
                internalType: 'string',
                type: 'string',
            },
        ],
        name: 'purchase',
        outputs: [
            {
                name: 'tokenId',
                internalType: 'uint256',
                type: 'uint256',
            },
        ],
    },
];

export const MirrorFactoryABI = [
    {
        inputs: [
            { internalType: 'address', name: '_owner', type: 'address' },
            { internalType: 'address', name: '_treasuryConfiguration', type: 'address' },
            { internalType: 'address', name: '_o11y', type: 'address' },
            { internalType: 'uint256', name: '_maxLimit', type: 'uint256' },
            { internalType: 'bool', name: '_guardOn', type: 'bool' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            {
                components: [
                    { internalType: 'string', name: 'name', type: 'string' },
                    { internalType: 'string', name: 'symbol', type: 'string' },
                    { internalType: 'string', name: 'description', type: 'string' },
                    { internalType: 'string', name: 'imageURI', type: 'string' },
                    { internalType: 'string', name: 'contentURI', type: 'string' },
                    { internalType: 'uint256', name: 'price', type: 'uint256' },
                    { internalType: 'uint256', name: 'limit', type: 'uint256' },
                    { internalType: 'address', name: 'fundingRecipient', type: 'address' },
                    { internalType: 'address', name: 'renderer', type: 'address' },
                    { internalType: 'uint256', name: 'nonce', type: 'uint256' },
                ],
                internalType: 'struct IWritingEditions.WritingEdition',
                name: 'edition',
                type: 'tuple',
            },
            { internalType: 'uint8', name: 'v', type: 'uint8' },
            { internalType: 'bytes32', name: 'r', type: 'bytes32' },
            { internalType: 'bytes32', name: 's', type: 'bytes32' },
            { internalType: 'address', name: 'tokenRecipient', type: 'address' },
            { internalType: 'string', name: 'message', type: 'string' },
            { internalType: 'address', name: 'mintReferral', type: 'address' },
        ],
        name: 'createWithSignature',
        outputs: [{ internalType: 'address', name: 'clone', type: 'address' }],
        stateMutability: 'payable',
        type: 'function',
    },
];
