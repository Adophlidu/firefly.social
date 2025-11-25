'use client';

import { useQuery } from '@tanstack/react-query';

import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { getAllConnectionsFormatted } from '@/providers/firefly/endpoint/getAllConnectionsFormatted.js';

export const queryMyAllConnections = {
    queryKey: ['allConnections'],
    queryFn() {
        return getAllConnectionsFormatted();
    },
} as const;

export function useAllConnections(options?: { enabled?: boolean }) {
    const isLogin = useIsLoginFirefly();
    const queryResult = useQuery({ ...queryMyAllConnections, enabled: isLogin ?? options?.enabled });

    return {
        ...queryResult,
        data: !isLogin ? undefined : queryResult.data,
    };
}
