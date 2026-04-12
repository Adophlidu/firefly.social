'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { useVerifyAndBindWallet } from '@/hooks/useVerifyAndBindWallet.js';
import { AddWalletModalRef } from '@/modals/AddWalletModal/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
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
            await AddWalletModalRef.openAndWaitForClose({
                connections,
            });
            onSuccess?.();
            return;
        }
        const selectedWallet = await WalletConnectModalRef.openAndWaitForClose({ customTitle: t`Select Wallet` });
        if (!selectedWallet) return;

        await handleBind(selectedWallet.networkType);
        onSuccess?.();
    }, [connections, openWallets, onSuccess, handleBind]);

    return (
        <ClickableButton
            {...rest}
            className="text-medium text-main h-10 w-full max-w-[200px] rounded-lg border border-current bg-bottom px-[18px] font-bold leading-10"
            onClick={handleAddWallet}
            disabled={loading || disabled}
        >
            {loading ? <Trans>Adding...</Trans> : <Trans>Add Wallet</Trans>}
        </ClickableButton>
    );
});
