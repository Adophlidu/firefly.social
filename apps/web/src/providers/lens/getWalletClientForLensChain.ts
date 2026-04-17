import type { Account, Chain, Transport, WalletClient } from 'viem';
import { lens } from 'viem/chains';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getWalletClientRequired, type OpenProps } from '@/helpers/getWalletClientRequired.js';

export async function getWalletClientForLensChain(openProps?: OpenProps) {
    const client = await getWalletClientRequired(wagmiConfig, { chainId: lens.id }, openProps);
    return client as WalletClient<Transport, Chain, Account>;
}
