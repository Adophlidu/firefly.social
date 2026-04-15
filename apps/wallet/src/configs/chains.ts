import {
    arbitrum,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    lens,
    lensTestnet,
    linea,
    mainnet,
    optimism,
    plasma,
    polygon,
    scroll,
    zkSync,
} from 'viem/chains';

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
    lens,
    lensTestnet,
] as const;

export type ChainId = (typeof chains)[number]['id'];

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
