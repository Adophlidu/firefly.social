import type { MetaResponse } from '@nktkas/hyperliquid';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/constants/enum';
import { resolveMetaAvatar } from '@/helpers/resolveMetaAvatar';
import { useAllPerpMetas } from '@/hooks/Perps/useAllPerpMetas';
import { getPerpsTokens } from '@/services/firefly/getPerpsTokens';
import { allDexsAssetCtxsAtom } from '@/store/websocket';
import type { PerpsMeta } from '@/types/ui';

interface Options {
    category?: string;
    enabled?: boolean;
    keyword?: string;
}

function isLowerCaseEqual(str1: string, str2: string) {
    return str1.toLowerCase() === str2.toLowerCase();
}

function searchMetas(
    metas: Array<
        MetaResponse['universe'][number] & {
            index: number;
        }
    >,
    keyword?: string,
) {
    if (!keyword) return metas;

    const fullMatch = metas.filter((meta) => isLowerCaseEqual(meta.name, keyword));
    const halfMatch = metas.filter(
        (meta) => !isLowerCaseEqual(meta.name, keyword) && meta.name.toLowerCase().includes(keyword.toLowerCase()),
    );

    return [...fullMatch, ...halfMatch];
}

export function usePerpsMetas({ category, keyword }: Options) {
    const allDexsAssetCtxs = useAtomValue(allDexsAssetCtxsAtom);

    const { data: perpsMetas, isLoading: isPerpsMetasLoading } = useAllPerpMetas();
    const {
        data: perpsMetaIds,
        isLoading: isPerpsMetaIdsLoading,
        error: perpsMetaIdsError,
    } = useQuery({
        queryKey: ['perps', 'meta-ids'],
        staleTime: STALE_TIMES.MINUTE_10,
        queryFn: () => getPerpsTokens(),
    });

    const perpsList = useMemo<PerpsMeta[]>(() => {
        const universe =
            perpsMetas?.flatMap((x) =>
                x.universe.map((x, i) => ({
                    ...x,
                    index: i,
                })),
            ) || [];
        if (!universe?.length || !category) return [];

        const filteredIds = perpsMetaIds?.filter((meta) => meta.category_name === category).map((meta) => meta.name);
        const filteredMetas = searchMetas(
            category === 'all'
                ? universe
                : universe.filter((meta) => filteredIds?.some((id) => id.toLowerCase() === meta.name.toLowerCase())),
            keyword,
        );
        return filteredMetas.map((meta) => {
            const [_dex, _name] = meta.name.split(':');
            const dex = _name ? _dex : undefined;

            const assetCtx = allDexsAssetCtxs?.find(([d]) => d === (dex || ''))?.[1]?.[meta.index];
            const priceDiff = assetCtx ? parseFloat(assetCtx.markPx) - parseFloat(assetCtx.prevDayPx) : undefined;
            const priceDiffRatio =
                assetCtx && priceDiff
                    ? parseFloat(assetCtx.prevDayPx) > 0
                        ? (priceDiff / parseFloat(assetCtx.prevDayPx)) * 100
                        : undefined
                    : undefined;

            return {
                ...meta,
                dex,
                avatar: resolveMetaAvatar(meta.name),
                mid: assetCtx?.markPx ?? undefined,
                dayNtlVlm: assetCtx?.dayNtlVlm,
                priceDiff,
                priceDiffRatio,
            };
        });
    }, [perpsMetas, perpsMetaIds, keyword, category, allDexsAssetCtxs]);

    return {
        data: perpsList,
        error: perpsMetaIdsError,
        isLoading: isPerpsMetaIdsLoading,
        isGlobalLoading: isPerpsMetasLoading,
    };
}
