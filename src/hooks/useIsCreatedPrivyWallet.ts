import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/configs/queryClient.js';
import { sentryClient } from '@/configs/sentryClient.js';
import { InvalidResultError } from '@/constants/error.js';
import { retry } from '@/helpers/retry.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { privyWalletConnectionsQuery, usePrivyConnections } from '@/hooks/usePrivyConnections.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';
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
            const data = await fireflyEndpointProvider.createPrivyWallet();
            if (!data) {
                sentryClient.captureException(
                    ExceptionId.CREATE_PRIVY_WALLET,
                    new Error(`Create privy wallet failed`),
                    {
                        profileId: currentProfileSession?.profileId as string,
                    },
                );
                return;
            }
            await retry(async () => {
                const { connected } = await queryClient.fetchQuery({
                    ...privyWalletConnectionsQuery,
                    staleTime: 0,
                });
                if (connected.length < 2) {
                    throw new InvalidResultError();
                }
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
