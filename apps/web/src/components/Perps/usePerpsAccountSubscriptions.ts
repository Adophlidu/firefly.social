'use client';

import { type PerpsAddress, perpsQueryKeys, usePerpsClient, usePerpsMarkets } from '@dimensiondev/perps-react';
import type { ISubscription } from '@nktkas/hyperliquid';
import type { UserFillsResponse } from '@nktkas/hyperliquid/api/info';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getPerpsDexes } from '@/components/Perps/getPerpsDexes.js';
import { mergePerpsFills, perpsAggregatedFillsQueryKey } from '@/components/Perps/perpsAccountSubscriptions.js';

const SUBSCRIPTION_RETRY_DELAY = 3000;

export function usePerpsAccountSubscriptions(address?: PerpsAddress) {
    const client = usePerpsClient();
    const markets = usePerpsMarkets();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!address) return;
        const dexes = getPerpsDexes(markets.data);

        let disposed = false;
        const subscriptions = new Set<ISubscription>();
        const retryTimers = new Set<ReturnType<typeof setTimeout>>();
        const subscribe = (factory: () => Promise<ISubscription>) => {
            factory()
                .then((subscription) => {
                    if (disposed) {
                        void subscription.unsubscribe();
                        return;
                    }
                    subscriptions.add(subscription);
                })
                .catch(() => {
                    if (disposed) return;
                    const timer = setTimeout(() => {
                        retryTimers.delete(timer);
                        subscribe(factory);
                    }, SUBSCRIPTION_RETRY_DELAY);
                    retryTimers.add(timer);
                });
        };

        for (const dex of dexes) {
            subscribe(() =>
                client.subscriptions.clearinghouseState({ user: address, dex }, ({ clearinghouseState }) => {
                    queryClient.setQueryData(perpsQueryKeys.account(address, dex), clearinghouseState);
                }),
            );
            subscribe(() =>
                client.subscriptions.openOrders({ user: address, dex }, ({ orders }) => {
                    queryClient.setQueryData(perpsQueryKeys.openOrders(address, dex), orders);
                }),
            );
        }

        subscribe(() =>
            client.subscriptions.spotState({ user: address }, ({ spotState }) => {
                queryClient.setQueryData(perpsQueryKeys.spotAccount(address), spotState);
            }),
        );
        subscribe(() =>
            client.subscriptions.userFills({ user: address, aggregateByTime: true }, ({ fills, isSnapshot }) => {
                queryClient.setQueryData<UserFillsResponse>(perpsAggregatedFillsQueryKey(address), (current) =>
                    isSnapshot ? fills : mergePerpsFills(current, fills),
                );
            }),
        );

        return () => {
            disposed = true;
            retryTimers.forEach(clearTimeout);
            subscriptions.forEach((subscription) => void subscription.unsubscribe());
        };
    }, [address, client, markets.data, queryClient]);
}
