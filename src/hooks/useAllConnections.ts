'use client';

import { useQuery } from '@tanstack/react-query';

import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

export function useAllConnections(options?: { enabled?: boolean }) {
    const isLogin = useIsLoginFirefly();
    const queryResult = useQuery({ ...queryMyAllConnections, enabled: isLogin ?? options?.enabled });

    return {
        ...queryResult,
        data: !isLogin ? undefined : queryResult.data,
    };
}
