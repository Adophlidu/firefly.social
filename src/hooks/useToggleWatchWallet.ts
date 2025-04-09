import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';

interface Options {
    handleOrEnsOrAddress: string;
    address: Address;
    following: boolean;
}

export function useToggleWatchWallet({ handleOrEnsOrAddress, address, following }: Options) {
    const mutation = useMutation({
        mutationFn: async () => {
            try {
                if (following) {
                    const result = await FireflyEndpointProvider.unwatchWallet(address);
                    enqueueSuccessMessage(t`${handleOrEnsOrAddress} unwatched`);
                    return result;
                }
                const result = await FireflyEndpointProvider.watchWallet(address);
                setupFirebaseFcmConnection({ force: true, showUi: true });
                enqueueSuccessMessage(t`${handleOrEnsOrAddress} watched`);
                return result;
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    following
                        ? t`Failed to unwatch ${handleOrEnsOrAddress}.`
                        : t`Failed to watch ${handleOrEnsOrAddress}.`,
                );
                throw error;
            }
        },
    });
    return mutation;
}
