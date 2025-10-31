import { nativeBridgeProvider, Network, SupportedMethod } from '@firefly/native-bridge';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { useAsyncFn } from 'react-use';

import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import type { SocialSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { AddWalletModalRef } from '@/modals/AddWalletModal/index.js';
import { captureActivityConnectWalletEvent } from '@/providers/telemetry/captureActivityEvent.js';

export function useActivityBindAddress(source: SocialSource | SocialSource[], chainId: number) {
    const { onChangeAddress } = useContext(ActivityContext);
    const { refetch: refetchActivityClaimCondition } = useActivityClaimCondition(source);
    const { data: { connected = EMPTY_LIST } = {}, refetch } = useActivityConnections();
    return useAsyncFn(async () => {
        if (nativeBridgeProvider.supported) {
            await runInSafeAsync(async () => {
                const address = await nativeBridgeProvider.request(SupportedMethod.BIND_WALLET, {
                    type: isValidChainIdSolana(chainId) ? Network.Solana : Network.EVM,
                });
                onChangeAddress(address);
                captureActivityConnectWalletEvent(address);
                await refetchActivityClaimCondition();
                await refetch();
            });
            return;
        }
        try {
            const { response } = await AddWalletModalRef.openAndWaitForClose({
                connections: connected,
            });
            if (response?.address) {
                onChangeAddress(response.address);
                captureActivityConnectWalletEvent(response.address);
            }
            await refetch();
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to bind address.`, {
                error,
            });
            throw error;
        }
    }, [chainId, connected, onChangeAddress, refetch, refetchActivityClaimCondition]);
}

export function usePureActivityBindAddress(chainId?: number) {
    const { onChangeAddress } = useContext(ActivityContext);
    const { data: { connected = EMPTY_LIST } = {}, refetch } = useActivityConnections();
    return useAsyncFn(async () => {
        if (nativeBridgeProvider.supported) {
            await runInSafeAsync(async () => {
                const address = await nativeBridgeProvider.request(SupportedMethod.BIND_WALLET, {
                    type: chainId ? (isValidChainIdSolana(chainId) ? Network.Solana : Network.EVM) : Network.All,
                });
                onChangeAddress(address);
                captureActivityConnectWalletEvent(address);
                await refetch();
            });
            return;
        }
        try {
            const { response } = await AddWalletModalRef.openAndWaitForClose({
                connections: connected,
            });
            if (response?.address) {
                onChangeAddress(response.address);
                captureActivityConnectWalletEvent(response.address);
            }
            await refetch();
            return response?.address;
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to bind address.`, {
                error,
            });
            throw error;
        }
    }, [chainId, connected, onChangeAddress, refetch]);
}
