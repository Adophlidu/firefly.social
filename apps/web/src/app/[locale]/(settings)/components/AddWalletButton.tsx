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
        // Bind inside onConnect, while the wallet is still connected: the EVM
        // connection is torn down once the modal closes.
        await openAndWaitForCloseWalletConnectModal({
            customTitle: t`Select Wallet`,
            onConnect: (networkType, caipAddress) => bindWallet(networkType, connections, { caipAddress }),
        });
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
