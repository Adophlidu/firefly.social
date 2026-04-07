import { defineChain } from 'viem';
import {
    arbitrum,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    linea,
    mainnet,
    optimism,
    plasma,
    polygon,
    scroll,
    zkSync,
} from 'viem/chains';
import { chainConfig } from 'viem/zksync';

export const lensMainnet = defineChain({
    ...chainConfig,
    id: 232,
    name: 'Lens',
    network: 'lens-chain-mainnet',
    nativeCurrency: {
        name: 'GHO Token',
        symbol: 'GHO',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.lens.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Lens Explorer',
            url: 'https://explorer.lens.xyz/',
        },
    },
    contracts: {
        multicall3: {
            address: '0x6b6dEa4D80e3077D076733A04c48F63c3BA49320',
        },
        wrappedGasToken: {
            address: '0x6bdc36e20d267ff0dd6097799f82e78907105e2f',
        },
    },
    testnet: false,
});

export const lensTestnet = defineChain({
    ...chainConfig,
    id: 37111,
    name: 'Lens Testnet',
    network: 'lens-chain-testnet',
    nativeCurrency: {
        name: 'Grass Token',
        symbol: 'GRASS',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.lens.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Lens Testnet Explorer',
            url: 'https://explorer.testnet.lens.xyz/',
        },
    },
    contracts: {
        multicall3: {
            address: '0x8A44EDE8a6843a997bC0Cc4659e4dB1Da8f91116',
        },
        wrappedGasToken: {
            address: '0xeee5a340Cdc9c179Db25dea45AcfD5FE8d4d3eB8',
        },
    },
    testnet: true,
});

export const chains = [
    mainnet,
    base,
    bsc,
    optimism,
    polygon,
    avalanche,
    blast,
    scroll,
    linea,
    arbitrum,
    zkSync,
    celo,
    plasma,
    lensMainnet,
    lensTestnet,
] as const;

export const visibleChains = [
    mainnet,
    base,
    bsc,
    optimism,
    polygon,
    avalanche,
    blast,
    scroll,
    linea,
    arbitrum,
    zkSync,
    celo,
    plasma,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;
