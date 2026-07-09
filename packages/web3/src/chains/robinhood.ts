import { ROBINHOOD_RPC_URL } from '@dimensiondev/constants/static';
import { defineChain } from 'viem';

/**
 * Robinhood Chain (chainId 4663) — EVM, native ETH.
 * Not shipped by viem, so defined locally.
 * Multicall3 (0xcA11bde05977b3631167028862bE2a173976CA11) is deployed at genesis (block 0).
 */
export const robinhood = /* #__PURE__*/ defineChain({
    id: 4663,
    name: 'Robinhood',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [ROBINHOOD_RPC_URL] },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 0,
        },
    },
});
