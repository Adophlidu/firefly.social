'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openAndWaitForCloseAddWalletModal } from '@/helpers/openAddWalletModal.js';
import { openAndWaitForCloseWalletConnectModal } from '@/helpers/openWalletConnectModal.js';
import { useVerifyAndBindWallet } from '@/hooks/useVerifyAndBindWallet.js';
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
    const [, handleBind] = useVerifyAndBindWallet(connections);
    const [{ loading }, handleAddWallet] = useAsyncFn(async () => {
        if (!openWallets) {
            await openAndWaitForCloseAddWalletModal({
                connections,
            });
            onSuccess?.();
            return;
        }
        const selectedWallet = await openAndWaitForCloseWalletConnectModal({ customTitle: t`Select Wallet` });
        if (!selectedWallet) return;

        await handleBind(selectedWallet.networkType);
        onSuccess?.();
    }, [connections, openWallets, onSuccess, handleBind]);

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
