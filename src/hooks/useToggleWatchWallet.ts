import { t } from '@lingui/core/macro';
import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import {
    captureWalletFollowEvent,
    captureWalletUnfollowEvent,
} from '@/providers/telemetry/captureWalletFollowEvent.js';
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
                    const result = await fireflyEndpointProvider.unwatchWallet(address);
                    enqueueSuccessMessage(t`Unfollowed ${handleOrEnsOrAddress} on Firefly`);
                    captureWalletUnfollowEvent();
                    return result;
                }
                const result = await fireflyEndpointProvider.watchWallet(address);
                setupFirebaseFcmConnection({ force: true, showUi: true });
                enqueueSuccessMessage(t`Followed ${handleOrEnsOrAddress} on Firefly`);
                captureWalletFollowEvent();
                return result;
            } catch (error) {
                enqueueMessageFromError(
                    error,
                    following
                        ? t`Failed to unfollow ${handleOrEnsOrAddress} on Firefly.`
                        : t`Failed to follow ${handleOrEnsOrAddress} on Firefly.`,
                );
                throw error;
            }
        },
    });
    return mutation;
}
