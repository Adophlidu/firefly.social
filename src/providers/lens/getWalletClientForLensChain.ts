import type { Account, Chain, Transport, WalletClient } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { LENS_CHAIN_ID } from '@/constants/index.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';

export async function getWalletClientForLensChain() {
    const client = await getWalletClientRequired(wagmiConfig, { chainId: LENS_CHAIN_ID });
    return client as WalletClient<Transport, Chain, Account>;
}
