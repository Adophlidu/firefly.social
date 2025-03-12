import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { AddWalletModalRef } from '@/modals/controls.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface AddWalletButtonProps extends Omit<ClickableButtonProps, 'children'> {
    connections: FireflyWalletConnection[];
    onSuccess?: () => void;
}

export const AddWalletButton = memo<AddWalletButtonProps>(function AddWalletButton({
    disabled = false,
    connections,
    onSuccess,
    ref,
    ...rest
}) {
    const [{ loading }, handleAddWallet] = useAsyncFn(async () => {
        await AddWalletModalRef.openAndWaitForClose({
            connections,
        });
        onSuccess?.();
    }, [connections, onSuccess]);

    return (
        <ClickableButton
            {...rest}
            className="h-10 w-full max-w-[200px] rounded-lg border border-current bg-bottom px-[18px] text-medium font-bold leading-10 text-main"
            onClick={handleAddWallet}
            disabled={loading || disabled}
        >
            {loading ? <Trans>Adding...</Trans> : <Trans>Add wallet</Trans>}
        </ClickableButton>
    );
});
