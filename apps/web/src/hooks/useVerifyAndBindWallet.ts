import type { NetworkType } from '@dimensiondev/enums';
import { WalletSource } from '@dimensiondev/enums';
import { formatAddress, isSameAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { first } from 'lodash-es';
import { useAsyncFn } from 'react-use';

import { FetchError } from '@/constants/error.js';
import { openAndWaitForCloseMyWalletsModal } from '@/controllers/openMyWalletsModal.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { verifyAndBindWallet } from '@/services/verifyAndBindWallet.js';

export interface BindWalletCallbacks {
    onSuccess?: (response?: BindWalletResponse['data']) => void;
    onError?: (error: Error) => void;
}

export interface BindWalletOptions extends BindWalletCallbacks {
    /** CAIP address (e.g. `eip155:1:0x…`) of the just-connected wallet, if known. */
    caipAddress?: string;
}

/**
 * Bind the currently-connected wallet of `network`. Stateless (no React hooks) so
 * it is safe to invoke from inside the wallet-connect modal's onConnect window,
 * where the EVM connection is still live — it is torn down once the modal closes.
 * Routing this through a hook (useAsyncFn) from onConnect would trigger a
 * setState-in-render violation, so callers that need loading state wrap this in
 * {@link useVerifyAndBindWallet} themselves. Toasts for success/failure are shown
 * here; re-throws so hook callers can still observe the error state.
 */
export async function bindWallet(
    network: NetworkType,
    connections: FireflyWalletConnection[],
    options?: BindWalletOptions,
) {
    const { onSuccess, onError, caipAddress } = options ?? {};
    try {
        let isPrivyConnected = false;
        const result = await verifyAndBindWallet(
            network,
            (address: string) => {
                const existedConnection = connections.find((connection) => isSameAddress(connection.address, address));
                if (!existedConnection) return false;
                if (existedConnection.source === WalletSource.Privy) {
                    isPrivyConnected = true;
                    return true;
                }
                const addressName = first(existedConnection.ens) || formatAddress(address, 8);
                enqueueWarningMessage(t`${addressName} is already connected.`);
                onError?.(new Error(`Already connected address name = ${addressName}.`));
                return true;
            },
            caipAddress,
        );
        if (!result) {
            if (isPrivyConnected) {
                enqueueWarningMessage(t`Please switch the wallet you want to connect`);
                openAndWaitForCloseMyWalletsModal();
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
        } else {
            const messageFromError = error instanceof FetchError ? error.text : '';
            enqueueMessageFromError(error, messageFromError || t`Failed to add wallet`);
            onError?.(new Error('Failed to add wallet'));
        }
        throw error;
    }
}

export function useVerifyAndBindWallet(
    connections: FireflyWalletConnection[],
    onSuccess?: (response?: BindWalletResponse['data']) => void,
    onError?: (error: Error) => void,
) {
    return useAsyncFn(
        async (network: NetworkType) => {
            await bindWallet(network, connections, { onSuccess, onError });
        },
        [connections, onSuccess, onError],
    );
}
