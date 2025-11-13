import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { addAccountManager } from '@lens-protocol/client/actions';
import { Trans } from '@lingui/react/macro';

import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { Source } from '@/constants/enum.js';
import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getLensProfileOwner } from '@/providers/lens/getLensProfileOwner.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { captureLensBindManagerEvent } from '@/providers/telemetry/captureLensEvent.js';
import type { Account } from '@/providers/types/Account.js';

export async function askUserToAgreePermission({ profile }: Account) {
    return ConfirmModalRef.openAndWaitForClose({
        variant: 'normal',
        contentStyle: { gap: '8px' },
        modalStyle: { width: 400, maxWidth: '90vw' },
        title: <Trans>Auto Login Permission</Trans>,
        confirmButtonText: <Trans>Sign to Authorize</Trans>,
        content: (
            <div>
                <div className="flex w-full items-center gap-2 rounded-lg border border-lightLineSecond p-2">
                    <ProfileAvatar profile={profile} size={40} enableSourceIcon={false} />
                    <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-bold text-main">{profile.displayName}</p>
                        <p className="truncate text-sm text-second">@{profile.handle}</p>
                    </div>
                </div>
                <p className="mt-2 py-1 text-center text-medium font-medium text-second">
                    <Trans>Sign to grant Firefly permission for auto login</Trans>
                </p>
            </div>
        ),
    });
}

export async function setPrivyAsLensManager(account: Account): Promise<Boolean> {
    if (account.profile.source !== Source.Lens) throw new Error('This function only works for Lens.');

    // 1. get privy wallet
    const privyWallet = await ensureCreatedFireflyWallet('eth');
    if (!privyWallet?.address) throw new Error('Failed to ensure Firefly wallet');

    // 2. try adding signer for privy
    runInSafe(() =>
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER, {
            address: privyWallet.address,
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
    const profiles = await LensSocialMediaProvider.getProfilesByAddress(privyWallet.address);
    if (profiles.some((x) => isSameEthereumAddress(account.profile.profileId, x.profileId))) {
        throw new Error('This privy wallet is already a owner or manager of current lens account.');
    }

    // 6. ask user to confirm
    const agreed = await askUserToAgreePermission(account);
    if (!agreed) return false;

    // 7. bind manager
    const txData = await ensureLensResult(
        addAccountManager(lensSessionHolder.sessionClient, {
            address: safeEvmAddress(privyWallet.address),
            permissions: {
                canSetMetadataUri: true,
                canTransferNative: true,
                canTransferTokens: true,
                canExecuteTransactions: true,
            },
        }),
    );
    await handleOperationWithLensChain(txData);

    // 8. capture event
    captureLensBindManagerEvent(account.profile);

    return true;
}
