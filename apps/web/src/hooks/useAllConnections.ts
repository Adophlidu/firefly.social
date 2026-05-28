'use client';

import { useQuery } from '@tanstack/react-query';

import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

export function useAllConnections(options?: { enabled?: boolean }) {
    const isLoginFirefly = useIsLoginFirefly();
    const queryResult = useQuery({ ...queryMyAllConnections, enabled: isLoginFirefly ?? options?.enabled });

    return {
        ...queryResult,
        data: !isLoginFirefly ? undefined : queryResult.data,
    };
}
