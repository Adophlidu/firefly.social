import { useQuery } from '@tanstack/react-query';

import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function useIsSetupPrivyWallet() {
    const isLoginFirefly = useIsLoginFirefly();
    const { currentProfileSession } = useFireflyStateStore();
    const { data, isLoading, error } = useQuery({
        queryKey: ['privy-wallet', currentProfileSession?.profileId],
        queryFn() {
            return FireflyEndpointProvider.getPrivyWallet();
        },
        enabled: isLoginFirefly,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
    });

    return {
        isLoading,
        isSetupPrivyWallet: !!data,
        data,
        error,
    };
}
