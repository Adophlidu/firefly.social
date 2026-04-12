'use client';

import DisconnectIcon from '@dimensiondev/assets/disconnect.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import {
    getRelatedProfiles,
    waitForDisconnectConfirmation,
} from '@/app/[locale]/(settings)/components/waitForDisconnectConfirmation.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { WalletSource } from '@/constants/enum.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { disconnectAccount } from '@/providers/firefly/endpoint/disconnectAccount.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { removeAccountsByProfiles } from '@/services/account.js';

interface DisconnectBindAddressButtonProps {
    connection: FireflyWalletConnection;
}

export function DisconnectBindAddressButton({ connection }: DisconnectBindAddressButtonProps) {
    const { data: { connected = EMPTY_LIST } = {}, isLoading } = useAllConnections();
    const [{ loading }, disconnectWallet] = useAsyncFn(async () => {
        try {
            const disconnectedConnections = connected.filter(
                (x) => x.source !== WalletSource.Particle && x.address !== connection.address,
            );
            if (disconnectedConnections.length <= 0) {
                enqueueErrorMessage(
                    <Trans>
                        Failed to disconnect. Please leave at least 1 account or wallet address connected to keep your
                        immersive experience in Firefly.
                    </Trans>,
                );
                return;
            }

            const confirmed = await waitForDisconnectConfirmation(connection);
            if (!confirmed) return;

            await disconnectAccount(connection.address, resolveConnectionPlatform(connection.platform));

            const profiles = await getRelatedProfiles(connection);
            if (profiles.length) await removeAccountsByProfiles(profiles);
            enqueueSuccessMessage(<Trans>Disconnected from your Firefly account</Trans>);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to disconnect</Trans>);
            throw error;
        }
    }, [connected, connection]);

    return (
        <ClickableButton
            onClick={disconnectWallet}
            loading={loading || isLoading}
            className="size-5 shrink-0 cursor-pointer disabled:cursor-wait"
        >
            <DisconnectIcon width={20} height={20} />
        </ClickableButton>
    );
}
