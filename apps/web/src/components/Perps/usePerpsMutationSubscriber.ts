'use client';

import { decodePerpsMutationSettled } from '@dimensiondev/iframe-bridge';
import { type PerpsAddress, perpsQueryKeys } from '@dimensiondev/perps-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
    perpsAccountQueryKeyPrefix,
    perpsAggregatedFillsQueryKey,
    perpsOpenOrdersQueryKeyPrefix,
} from '@/components/Perps/perpsAccountSubscriptions.js';
import { resolvePerpsMutationReconciliation } from '@/components/Perps/resolvePerpsMutationReconciliation.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function usePerpsMutationSubscriber(address?: PerpsAddress) {
    const queryClient = useQueryClient();
    const subscribeToWalletEvents = useGlobalState.use.subscribeToWalletEvents();

    useEffect(() => {
        const unsubscribe = subscribeToWalletEvents('PERPS_MUTATION_SETTLED', (data) => {
            const decoded = decodePerpsMutationSettled(data);
            if (!decoded.ok || !address) return;
            const reconciliation = resolvePerpsMutationReconciliation(decoded.value);
            const scopes = new Set(reconciliation.invalidate);
            if (scopes.has('account') || scopes.has('positions')) {
                void queryClient.invalidateQueries({ queryKey: perpsAccountQueryKeyPrefix(address) });
            }
            if (scopes.has('account')) {
                void queryClient.invalidateQueries({ queryKey: perpsQueryKeys.spotAccount(address) });
            }
            if (scopes.has('open-orders')) {
                void queryClient.invalidateQueries({ queryKey: perpsOpenOrdersQueryKeyPrefix(address) });
            }
            if (scopes.has('fills')) {
                void queryClient.invalidateQueries({ queryKey: perpsAggregatedFillsQueryKey(address) });
            }
        });
        return unsubscribe;
    }, [address, queryClient, subscribeToWalletEvents]);
}
