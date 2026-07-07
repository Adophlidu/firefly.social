import type { Account, Chain, Transport, WalletClient } from 'viem';
import { lens } from 'viem/chains';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { getWalletClientRequired, type OpenProps } from '@/helpers/getWalletClientRequired.js';

export async function getWalletClientForLensChain(openProps?: OpenProps) {
    // Lazy so wagmiClient (new WagmiAdapter → wagmi + AppKit adapter) stays out of
    // the static graph of the login/metrics chains that reach this helper.
    const { wagmiConfig } = await loadWagmiClient();
    const client = await getWalletClientRequired(wagmiConfig, { chainId: lens.id }, openProps);
    return client as WalletClient<Transport, Chain, Account>;
}
