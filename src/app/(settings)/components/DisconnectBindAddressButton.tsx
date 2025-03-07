import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncFn } from 'react-use';

import { waitForDisconnectConfirmation } from '@/app/(settings)/components/waitForDisconnectConfirmation.js';
import DisconnectIcon from '@/assets/disconnect.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Source } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_SOURCE_WITH_ADDRESS } from '@/constants/index.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { flatLenConnections } from '@/helpers/formatWalletConnection.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type FireflyWalletConnection, type LensConnection, RelatedWalletSource } from '@/providers/types/Firefly.js';
import { disconnectFirefly } from '@/services/disconnectFirefly.js';

interface DisconnectBindAddressButtonProps {
    connection: FireflyWalletConnection;
}

export function DisconnectBindAddressButton({ connection }: DisconnectBindAddressButtonProps) {
    const queryClient = useQueryClient();
    const [{ loading }, disconnectWallet] = useAsyncFn(async () => {
        try {
            const {
                related = EMPTY_LIST,
                connected = EMPTY_LIST,
                social,
            } = await FireflyEndpointProvider.getAllConnectionsFormatted();
            const socialConnectionsAfterDisconnect = SOCIAL_SOURCE_WITH_ADDRESS.flatMap((source) => {
                const connections =
                    source === Source.Lens
                        ? flatLenConnections([...social[source].connected, ...social[source].unconnected])
                        : [...social[source].connected, ...social[source].unconnected];
                return connections.filter((x) => {
                    switch (source) {
                        case Source.Farcaster:
                        case Source.Lens:
                            return !connection.identities.some((identity) =>
                                isSameFireflyIdentity(identity, { source, id: `${(x as LensConnection).id}` }),
                            );
                        case Source.Bsky:
                        case Source.Twitter:
                            return true;
                        default:
                            safeUnreachable(source);
                            return true;
                    }
                });
            });

            const allWalletConnections = [...connected, ...related];
            const socialAccountRelated = allWalletConnections.filter((x) =>
                x.sources.filter((source) =>
                    [RelatedWalletSource.farcaster, RelatedWalletSource.lens].includes(source.source),
                ),
            );
            if (
                (socialAccountRelated.length <= 1 &&
                    socialAccountRelated.some((x) => isSameAddress(x.address, connection.address))) ||
                socialConnectionsAfterDisconnect.length <= 0
            ) {
                enqueueErrorMessage(
                    t`Failed to disconnect. Please leave at least 1 account or wallet address connected to keep your immersive experience in Firefly.`,
                );
                return;
            }

            const confirmed = await waitForDisconnectConfirmation(connection);
            if (!confirmed) return;

            await disconnectFirefly(connection);
            await queryClient.refetchQueries({ queryKey: ['my-wallet-connections'] });
            enqueueSuccessMessage(t`Disconnected from your Firefly account`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to disconnect`);
            throw error;
        }
    }, [connection, queryClient]);

    return (
        <ClickableButton
            onClick={disconnectWallet}
            loading={loading}
            className="h-5 w-5 shrink-0 cursor-pointer disabled:cursor-wait"
        >
            <DisconnectIcon width={20} height={20} />
        </ClickableButton>
    );
}
