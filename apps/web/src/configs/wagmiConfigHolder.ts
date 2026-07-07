import type { Config } from 'wagmi';

import { fallbackWagmiConfig } from '@/configs/wagmiFallbackClient.js';

let loadedConfig: Config | null = null;

/** Called by `configs/wagmiClient.ts` when the heavy config module loads. */
export function registerWagmiConfig(config: Config) {
    loadedConfig = config;
}

/**
 * The real wagmi config when the wallet stack is loaded, the connector-less
 * fallback otherwise. For visitors without a wallet session both behave
 * identically (same chains, same transports, no connections), so synchronous
 * read paths can call this without pulling the heavy wallet stack into their
 * chunk. Wallet flows that need connectors run only after the stack is active
 * (boot session detection or `activateWalletStack`), at which point this
 * returns the real config.
 */
export function getWagmiConfig(): Config {
    return loadedConfig ?? fallbackWagmiConfig;
}
