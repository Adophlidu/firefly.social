'use client';

import { createConfig, http, type Transport } from 'wagmi';

import { wagmiChains, wagmiTransportUrls } from '@/configs/wagmiChains.js';

const transports: Record<number, Transport> = Object.fromEntries(
    wagmiChains.map((chain) => [chain.id, http(wagmiTransportUrls[chain.id])]),
);

/**
 * A connector-less wagmi config used while the full wallet stack
 * (`configs/wagmiClient.ts`: AppKit wagmi adapter + Privy connector) stays
 * unloaded on read-only page views.
 *
 * It exposes the same chain list as the real config. Transports match exactly
 * only for the chains with explicit URLs in `wagmiTransportUrls` (mainnet,
 * optimism, polygon, fantom); the others fall back to their default public RPC
 * here, while the real config routes them through the Reown Blockchain API —
 * so fallback read paths should stick to the explicitly-configured chains.
 * Read-path hooks (`useChainId`, `useChains`, `useEnsName`, `useEnsAvatar`, ...)
 * behave identically for visitors without a wallet session. Since it has no
 * connectors, connection hooks report "disconnected" — the same state those
 * visitors see with the real config.
 *
 * `storage: null` keeps it memory-only so it can never clobber the persisted
 * `wagmi.store` state that the real config re-hydrates from once the wallet
 * stack activates.
 */
export const fallbackWagmiConfig = createConfig({
    chains: wagmiChains,
    transports,
    connectors: [],
    storage: null,
    multiInjectedProviderDiscovery: false,
});
