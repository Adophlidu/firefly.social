'use client';

import DisconnectIcon from '@dimensiondev/assets/disconnect.svg';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { waitForDisconnectConfirmation } from '@/app/[locale]/(settings)/components/waitForDisconnectConfirmation.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { type FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface ReportButtonProps {
    connection: FireflyWalletConnection;
}

export function ReportButton({ connection }: ReportButtonProps) {
    const [{ loading }, handleReport] = useAsyncFn(async () => {
        try {
            const confirmed = await waitForDisconnectConfirmation(connection);
            if (!confirmed) return;
            const reason = 'Disconnect';

            await fireflyWalletProvider.reportAndDeleteWallet(connection, reason);
            enqueueSuccessMessage(<Trans>Disconnected from your Firefly account</Trans>);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to disconnect</Trans>);
            throw error;
        }
    }, [connection]);

    return (
        <ClickableButton
            onClick={handleReport}
            loading={loading}
            className="size-5 shrink-0 cursor-pointer disabled:cursor-wait"
        >
            <DisconnectIcon width={20} height={20} />
        </ClickableButton>
    );
}
