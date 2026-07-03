'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openAndWaitForCloseAddWalletModal } from '@/controllers/openAddWalletModal.js';
import { openAndWaitForCloseWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import { bindWallet } from '@/hooks/useVerifyAndBindWallet.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface AddWalletButtonProps extends Omit<ClickableButtonProps, 'children'> {
    connections: FireflyWalletConnection[];
    /** if true, open the wallet modal directly */
    openWallets?: boolean;
    onSuccess?: () => void;
}

export const AddWalletButton = memo<AddWalletButtonProps>(function AddWalletButton({
    disabled = false,
    openWallets = false,
    connections,
    onSuccess,
    ref,
    ...rest
}) {
    const [{ loading }, handleAddWallet] = useAsyncFn(async () => {
        if (!openWallets) {
            await openAndWaitForCloseAddWalletModal({ connections });
            onSuccess?.();
            return;
        }
        // Connect first, then bind after the modal closes. Signing inside the
        // modal's onConnect window is unstable — right after AppKit connect,
        // wagmi/AppKit state is mid-cascade and the account is transiently
        // de-authorized (double Connect popup / UnauthorizedProviderError).
        // Post-close the connection is stable (same pattern as verifyEthereumAddress).
        const selectedWallet = await openAndWaitForCloseWalletConnectModal({ customTitle: t`Select Wallet` });
        if (!selectedWallet) return;
        await bindWallet(selectedWallet.networkType, connections);
        onSuccess?.();
    }, [connections, openWallets, onSuccess]);

    return (
        <ClickableButton
            {...rest}
            className="h-10 w-full max-w-[200px] rounded-lg border border-current bg-bottom px-[18px] text-medium font-bold leading-10 text-main"
            onClick={handleAddWallet}
            disabled={loading || disabled}
        >
            {loading ? <Trans>Adding...</Trans> : <Trans>Add Wallet</Trans>}
        </ClickableButton>
    );
});
