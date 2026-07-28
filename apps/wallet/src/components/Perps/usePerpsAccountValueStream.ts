import type { PerpsClient } from '@dimensiondev/perps-core';
import { type PerpsAddress, perpsQueryKeys, usePerpsClient } from '@dimensiondev/perps-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

type SpotMarketsData = Awaited<ReturnType<PerpsClient['info']['spotMetaAndAssetCtxs']>>;

/** Keeps the HTTP account-value snapshot in sync with Hyperliquid's webData2 stream. */
export function usePerpsAccountValueStream(address: PerpsAddress | undefined) {
    const client = usePerpsClient();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!address) return;

        let disposed = false;
        let subscription: { unsubscribe(): Promise<void> } | undefined;
        void client.subscriptions
            .webData2({ user: address }, (event) => {
                if (disposed) return;

                queryClient.setQueryData(perpsQueryKeys.account(address), event.clearinghouseState);
                if (event.spotState) {
                    queryClient.setQueryData(perpsQueryKeys.spotAccount(address), event.spotState);
                }
                queryClient.setQueryData<SpotMarketsData>(perpsQueryKeys.spotMarkets(), (current) =>
                    current ? [current[0], event.spotAssetCtxs] : current,
                );
            })
            .then((value) => {
                if (disposed) void value.unsubscribe();
                else subscription = value;
            })
            .catch(() => undefined);

        return () => {
            disposed = true;
            void subscription?.unsubscribe();
        };
    }, [address, client, queryClient]);
}
