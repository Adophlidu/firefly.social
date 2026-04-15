import { isSameAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { first } from 'lodash-es';
import { useAsyncFn } from 'react-use';

import { type NetworkType, WalletSource } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { MyWalletsModalRef } from '@/modals/MyWalletsModal/refs.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { verifyAndBindWallet } from '@/services/verifyAndBindWallet.js';

export function useVerifyAndBindWallet(
    connections: FireflyWalletConnection[],
    onSuccess?: (response?: BindWalletResponse['data']) => void,
    onError?: (error: Error) => void,
) {
    return useAsyncFn(
        async (network: NetworkType) => {
            try {
                let isPrivyConnected = false;
                const result = await verifyAndBindWallet(network, (address: string) => {
                    const existedConnection = connections.find((connection) =>
                        isSameAddress(connection.address, address),
                    );
                    if (!existedConnection) return false;
                    if (existedConnection.source === WalletSource.Privy) {
                        isPrivyConnected = true;
                        return true;
                    }
                    const addressName = first(existedConnection.ens) || formatAddress(address, 8);
                    enqueueWarningMessage(t`${addressName} is already connected.`);
                    onError?.(new Error(`Already connected address name = ${addressName}.`));
                    return true;
                });
                if (!result) {
                    if (isPrivyConnected) {
                        enqueueWarningMessage(t`Please switch the wallet you want to connect`);
                        MyWalletsModalRef.openAndWaitForClose();
                        return;
                    }
                    onError?.(new Error('This address type is not supported'));
                    return;
                }
                enqueueSuccessMessage(t`Wallet added successfully`);
                onSuccess?.(result);
            } catch (error) {
                if (error instanceof Error && error.message.includes('already bound')) {
                    enqueueWarningMessage(
                        t`Sorry, this wallet is already linked to another Firefly account. Please try a different one.`,
                    );
                    onError?.(error);
                    throw error;
                }

                const messageFromError = error instanceof FetchError ? error.text : '';
                enqueueMessageFromError(error, messageFromError || t`Failed to add wallet`);
                onError?.(new Error('Failed to add wallet'));
                throw error;
            }
        },
        [connections, onSuccess, onError],
    );
}
