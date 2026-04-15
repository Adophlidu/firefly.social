import { runInSafeAsync } from '@dimensiondev/utils';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import type { Address } from 'viem';
import { getEnsAvatar, getEnsName } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { FireflyPlatform } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { trimify } from '@/helpers/trimify.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function searchWalletAddress(address: string): Promise<FireflyProfile | undefined> {
    const trimmed = trimify(address);

    if (isValidAddressEthereum(trimmed)) {
        const ensName = await runInSafeAsync(() =>
            getEnsName(wagmiConfig, { address: trimmed.toLowerCase() as Address, chainId: EthereumChainId.Mainnet }),
        );
        const ensAvatar = ensName
            ? await runInSafeAsync(() => getEnsAvatar(wagmiConfig, { name: ensName, chainId: EthereumChainId.Mainnet }))
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

    if (isValidAddressSolana(trimmed)) {
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
