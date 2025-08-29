import { useQuery } from '@tanstack/react-query';

import { WalletSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export const privyWalletConnectionsQuery = {
    ...queryMyAllConnections,
    select(data: Awaited<ReturnType<(typeof queryMyAllConnections)['queryFn']>>) {
        return data?.connected.filter((connect) => connect.source === WalletSource.Privy) ?? EMPTY_LIST;
    },
};

export function usePrivyConnections() {
    const isLoginFirefly = useIsLoginFirefly();
    const { data, ...query } = useQuery({
        ...privyWalletConnectionsQuery,
        enabled: isLoginFirefly,
    });
    return {
        connections: data ?? EMPTY_LIST,
        ...query,
    };
}
