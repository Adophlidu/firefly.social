import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { waitForDisconnectConfirmation } from '@/app/(settings)/components/waitForDisconnectConfirmation.js';
import DisconnectIcon from '@/assets/disconnect.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type FireflyWalletConnection, RelatedWalletSource } from '@/providers/types/Firefly.js';
import { disconnectFirefly } from '@/services/disconnectFirefly.js';

interface DisconnectButtonProps {
    connection: FireflyWalletConnection;
}

export function DisconnectButton({ connection }: DisconnectButtonProps) {
    const [{ loading }, disconnectWallet] = useAsyncFn(async () => {
        try {
            const { related = EMPTY_LIST } = await FireflyEndpointProvider.getAllConnectionsFormatted();
            const socialAccountRelated = related.filter((x) =>
                x.sources.filter((source) =>
                    [RelatedWalletSource.farcaster, RelatedWalletSource.lens].includes(source.source),
                ),
            );
            if (
                socialAccountRelated.length === 1 &&
                socialAccountRelated.some((x) => isSameAddress(x.address, connection.address))
            ) {
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
    }, [connection]);

    return (
        <span>
            {loading ? (
                <LoadingIcon size={20} />
            ) : (
                <DisconnectIcon onClick={disconnectWallet} className="cursor-pointer" width={20} height={20} />
            )}
        </span>
    );
}
