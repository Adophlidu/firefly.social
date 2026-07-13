import { ETHEREUM_RPC_URL, OPTIMISM_RPC_URL, POLYGON_RPC_URL } from '@dimensiondev/constants/static';
import { robinhood } from '@dimensiondev/web3/chains';
import type { Chain } from 'viem';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    baseSepolia,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    hyperEvm,
    lens,
    lensTestnet,
    linea,
    mainnet,
    metis,
    monadTestnet,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

/**
 * Single source of truth for the EVM chains supported by the wallet stack.
 *
 * Shared by the heavy wagmi config (`configs/wagmiClient.ts`, loaded on demand
 * with the AppKit adapter + Privy connector) and the lightweight fallback config
 * (`configs/wagmiFallbackClient.ts`, part of the eager bundle) so both always
 * expose the same chain list to wagmi hooks (`useChains`, `useChainId`, ...).
 */
// Typed as a generic chain tuple (not the literal chain types) so configs built
// from it are assignable to wagmi's default `Config` type, like the adapter's.
export const wagmiChains: readonly [Chain, ...Chain[]] = [
    mainnet,
    base,
    baseSepolia,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    blast,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    lens,
    lensTestnet,
    celo,
    zkSync,
    linea,
    monadTestnet,
    plasma,
    hyperEvm,
    robinhood,
];

/**
 * Chains with a custom RPC endpoint, used by the fallback config. Keep in sync
 * with the explicit `transports` passed to the WagmiAdapter in
 * `configs/wagmiClient.ts`. Chains not listed here fall back to the chain's
 * default public RPC.
 */
export const wagmiTransportUrls: Partial<Record<number, string>> = {
    [mainnet.id]: ETHEREUM_RPC_URL,
    [optimism.id]: OPTIMISM_RPC_URL,
    [polygon.id]: POLYGON_RPC_URL,
    [fantom.id]: 'https://rpc.ftm.tools',
};
