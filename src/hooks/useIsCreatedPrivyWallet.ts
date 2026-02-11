'use client';

import { InvalidResultError } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { retry } from '@/helpers/retry.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getPrivyWalletConnectionsQuery, usePrivyConnections } from '@/hooks/usePrivyConnections.js';
import { captureException, ExceptionId } from '@/providers/errorCapture/captureException.js';
import { createPrivyWallet } from '@/providers/firefly/endpoint/createPrivyWallet.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function useIsCreatedPrivyWallet() {
    const isLoginFirefly = useIsLoginFirefly();
    const { currentProfileSession } = useFireflyProfileStore();
    const { connections, isLoading: isLoadingPrivyConnections } = usePrivyConnections();
    const isCreatedPrivyWallet = connections.length >= 2;
    const enabled = !isLoadingPrivyConnections && isLoginFirefly && !isCreatedPrivyWallet;

    const { isLoading, error } = useQuery({
        queryKey: ['create-privy-wallet', currentProfileSession?.profileId, enabled],
        async queryFn() {
            const data = await createPrivyWallet();
            if (!data) {
                captureException(ExceptionId.CREATE_PRIVY_WALLET, new Error('Create privy wallet failed'), {
                    profileId: currentProfileSession?.profileId as string,
                });
                return;
            }
            await retry(async () => {
                const { connected } = await queryClient.fetchQuery({
                    ...getPrivyWalletConnectionsQuery(),
                    staleTime: 0,
                });
                if (connected.length < 2) throw new InvalidResultError();
            });
            return data;
        },
        enabled,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
    });

    return {
        isLoading,
        isCreatedPrivyWallet,
        error,
    };
}
