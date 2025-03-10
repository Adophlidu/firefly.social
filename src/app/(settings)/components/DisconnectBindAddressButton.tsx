import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useAsyncFn } from 'react-use';

import { waitForDisconnectConfirmation } from '@/app/(settings)/components/waitForDisconnectConfirmation.js';
import DisconnectIcon from '@/assets/disconnect.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { WalletSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { disconnectFirefly } from '@/services/disconnectFirefly.js';

interface DisconnectBindAddressButtonProps {
    connection: FireflyWalletConnection;
}

export function DisconnectBindAddressButton({ connection }: DisconnectBindAddressButtonProps) {
    const { data: { connected = EMPTY_LIST } = {}, isLoading } = useQuery({
        queryKey: ['my-wallet-connections'],
        queryFn: () => FireflyEndpointProvider.getAllConnectionsFormatted(),
    });
    const [{ loading }, disconnectWallet] = useAsyncFn(async () => {
        try {
            const disconnectedConnections = connected.filter(
                (x) => x.source !== WalletSource.Particle && x.address !== connection.address,
            );
            if (disconnectedConnections.length <= 0) {
                enqueueErrorMessage(
                    t`Failed to disconnect. Please leave at least 1 account or wallet address connected to keep your immersive experience in Firefly.`,
                );
                return;
            }

            const confirmed = await waitForDisconnectConfirmation(connection);
            if (!confirmed) return;

            await disconnectFirefly(connection);
            enqueueSuccessMessage(t`Disconnected from your Firefly account`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to disconnect`);
            throw error;
        }
    }, [connected, connection]);

    return (
        <ClickableButton
            onClick={disconnectWallet}
            loading={loading || isLoading}
            className="h-5 w-5 shrink-0 cursor-pointer disabled:cursor-wait"
        >
            <DisconnectIcon width={20} height={20} />
        </ClickableButton>
    );
}
