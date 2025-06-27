import type { chains } from '@lens-chain/sdk/viem';
import type { Account, Transport, WalletClient } from 'viem';

import { config } from '@/configs/wagmiClient.js';
import { LENS_CHAIN_ID } from '@/constants/index.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';

export async function getWalletClientForLensChain() {
    const client = await getWalletClientRequired(config, { chainId: LENS_CHAIN_ID });
    return client as WalletClient<Transport, chains.LensChain, Account>;
}
