import { Source } from '@dimensiondev/enums';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { runInSafe } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';

import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { openAndWaitForCloseAddLensManagerModal } from '@/helpers/openAddLensManagerModal.js';
import { closeLoginModal } from '@/helpers/openLoginModal.js';
import { getLensProfileOwner } from '@/providers/lens/getLensProfileOwner.js';
import { getProfilesByAddress } from '@/providers/lens/getProfilesByAddress.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import type { Account } from '@/providers/types/Account.js';

export async function setPrivyAsLensManager(account: Account): Promise<Boolean> {
    if (account.profile.source !== Source.Lens) throw new Error('This function only works for Lens.');

    // 1. get privy wallet
    const privyEvmAddress = (await ensureCreatedFireflyWallet('eth'))?.address;
    if (!privyEvmAddress) throw new Error('Failed to ensure Firefly wallet');

    // 2. try adding signer for privy
    runInSafe(() =>
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER, {
            address: privyEvmAddress,
            signers: [], // !: For on-device this should be empty array, only can specify a special signer for TEE
        }),
    );

    // 3. get lens owner address
    const ownerAddress = await getLensProfileOwner(account.profile);
    if (!ownerAddress) throw new Error('Failed to find lens profile owner.');

    // 4. ensure current wallet is owner
    const walletClient = await getWalletClientForLensChain({ silent: true });
    if (!isSameEthereumAddress(walletClient.account.address, ownerAddress))
        throw new Error('Only lens owner can bind manager.');

    // 5. check if already bound
    const profiles = await getProfilesByAddress(privyEvmAddress);
    if (profiles.some((x) => isSameEthereumAddress(account.profile.profileId, x.profileId))) {
        throw new Error('This privy wallet is already a owner or manager of current lens account.');
    }

    closeLoginModal();

    // 6. bind manager
    const result = await openAndWaitForCloseAddLensManagerModal({
        profile: account.profile,
        manager: privyEvmAddress,
    });

    return result === true;
}
