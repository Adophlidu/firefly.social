import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isAddress } from 'viem';

import {
    HYPERLIQUID_QUERY_KEY_ROOT,
    HYPERLIQUID_QUERY_PERPS_ACCOUNT_BUNDLE,
    HYPERLIQUID_QUERY_SPOT_META_AND_ASSET_CTXS,
} from '@/constants/hyperliquid.js';
import {
    type ClearinghouseStateLike,
    computePerpsComputedAccountValue,
    type SpotClearinghouseStateLike,
    type SpotMetaAndAssetCtxsResponse,
} from '@/lib/hyperliquid/computePerpsComputedAccountValue.js';
import { postHyperliquidInfo } from '@/lib/hyperliquid/hyperliquidInfoApi.js';

export type UsePerpsComputedAccountValueResult = Omit<
    ReturnType<typeof computePerpsComputedAccountValue>,
    'isLoading'
> & {
    /** True when `address` is valid and any upstream request or derived loading flag is active. */
    isLoading: boolean;
    /** True while Hyperliquid info requests for this address (or global spot meta) are in flight. */
    isQueryPending: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};

interface PerpsUserBundle {
    abstraction: string;
    clearinghouse: ClearinghouseStateLike;
    spotClearinghouse: SpotClearinghouseStateLike;
}

/**
 * Fetches Hyperliquid perp + spot account value for an EVM address via the public info API
 * (same logic as `packages/rn-ui/src/store/perpsComputedAccountValue.ts`, no perp SDK).
 */
export function usePerpsComputedAccountValue(
    address: string | undefined,
    options?: { enabled?: boolean },
): UsePerpsComputedAccountValueResult {
    const enabled = (options?.enabled ?? true) && Boolean(address) && isAddress(address as `0x${string}`);
    const user = address as `0x${string}`;

    const [spotMetaQuery, userBundleQuery] = useQueries({
        queries: [
            {
                queryKey: [HYPERLIQUID_QUERY_KEY_ROOT, HYPERLIQUID_QUERY_SPOT_META_AND_ASSET_CTXS],
                queryFn: () => postHyperliquidInfo<SpotMetaAndAssetCtxsResponse>({ type: 'spotMetaAndAssetCtxs' }),
                staleTime: 60_000,
            },
            {
                queryKey: [
                    HYPERLIQUID_QUERY_KEY_ROOT,
                    HYPERLIQUID_QUERY_PERPS_ACCOUNT_BUNDLE,
                    enabled ? user.toLowerCase() : 'none',
                ],
                enabled,
                queryFn: async (): Promise<PerpsUserBundle> => {
                    const [abstraction, clearinghouse, spotClearinghouse] = await Promise.all([
                        postHyperliquidInfo<string>({ type: 'userAbstraction', user }),
                        postHyperliquidInfo<ClearinghouseStateLike>({ type: 'clearinghouseState', user }),
                        postHyperliquidInfo<SpotClearinghouseStateLike>({
                            type: 'spotClearinghouseState',
                            user,
                        }),
                    ]);
                    return { abstraction, clearinghouse, spotClearinghouse };
                },
            },
        ],
    });

    const computed = useMemo(
        () =>
            computePerpsComputedAccountValue({
                abstractionRaw: userBundleQuery.data?.abstraction,
                clearinghouse: userBundleQuery.data?.clearinghouse,
                spotClearinghouse: userBundleQuery.data?.spotClearinghouse,
                spotMetaAndAssetCtxs: spotMetaQuery.data,
            }),
        [userBundleQuery.data, spotMetaQuery.data],
    );

    const isQueryPending = Boolean(enabled) && (spotMetaQuery.isPending || userBundleQuery.isPending);

    const isLoading = Boolean(enabled) && (spotMetaQuery.isPending || userBundleQuery.isPending || computed.isLoading);

    const error = (spotMetaQuery.error as Error | null) ?? (userBundleQuery.error as Error | null) ?? null;

    const refetch = async () => {
        await Promise.all([spotMetaQuery.refetch(), userBundleQuery.refetch()]);
    };

    return {
        ...computed,
        isLoading,
        isQueryPending,
        error,
        refetch,
    };
}
