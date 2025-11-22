'use client';

import { useQuery } from '@tanstack/react-query';

import { WalletSource } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getAllConnectionsFormatted } from '@/providers/firefly/endpoint/getAllConnectionsFormatted.js';

export function getPrivyWalletConnectionsQuery() {
    return {
        queryKey: ['allConnections'],
        queryFn() {
            return getAllConnectionsFormatted();
        },
        select(data: Awaited<ReturnType<typeof getAllConnectionsFormatted>>) {
            return data?.connected.filter((connect) => connect.source === WalletSource.Privy) ?? EMPTY_LIST;
        },
    };
}

export function usePrivyConnections() {
    const isLoginFirefly = useIsLoginFirefly();
    const { data, ...query } = useQuery({
        ...getPrivyWalletConnectionsQuery(),
        enabled: isLoginFirefly,
    });
    return {
        connections: data ?? EMPTY_LIST,
        ...query,
    };
}
