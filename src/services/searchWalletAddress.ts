import { ChainId, isValidAddress } from '@masknet/web3-shared-evm';
import type { Address } from 'viem';
import { getEnsAvatar, getEnsName } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { FireflyPlatform } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { trimify } from '@/helpers/trimify.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';

export async function searchWalletAddress(address: string): Promise<FireflyProfile | undefined> {
    const trimmed = trimify(address);

    if (isValidAddress(trimmed.toLowerCase())) {
        const ensName = await runInSafeAsync(() =>
            getEnsName(config, { address: trimmed.toLowerCase() as Address, chainId: ChainId.Mainnet }),
        );
        const ensAvatar = ensName
            ? await runInSafeAsync(() => getEnsAvatar(config, { name: ensName, chainId: ChainId.Mainnet }))
            : undefined;

        return {
            platform: FireflyPlatform.Wallet,
            platform_id: trimmed,
            handle: trimmed,
            name: ensName || formatAddress(trimmed, 4),
            avatar: ensAvatar || '',
            hit: true,
            score: 0,
        };
    }

    if (isValidSolanaAddress(trimmed)) {
        return {
            platform: FireflyPlatform.Wallet,
            platform_id: trimmed,
            handle: trimmed,
            name: formatAddress(trimmed, 4),
            hit: true,
            score: 0,
        };
    }

    return;
}
