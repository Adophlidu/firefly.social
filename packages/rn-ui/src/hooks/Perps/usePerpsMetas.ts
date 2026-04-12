import type { MetaResponse } from '@nktkas/hyperliquid';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/constants/enum';
import { resolveMetaAvatar } from '@/helpers/resolveMetaAvatar';
import { useHyperliquid } from '@/hooks/useHyperliquid';
import { getPerpsTokens } from '@/services/firefly/getPerpsTokens';
import type { PerpsMeta } from '@/types/ui';

interface Options {
    category?: string;
    enabled?: boolean;
    keyword?: string;
}

function isLowerCaseEqual(str1: string, str2: string) {
    return str1.toLowerCase() === str2.toLowerCase();
}

function searchMetas(metas: MetaResponse['universe'], keyword?: string) {
    if (!keyword) return metas;

    const fullMatch = metas.filter((meta) => isLowerCaseEqual(meta.name, keyword));
    const halfMatch = metas.filter(
        (meta) => !isLowerCaseEqual(meta.name, keyword) && meta.name.toLowerCase().includes(keyword.toLowerCase()),
    );

    return [...fullMatch, ...halfMatch];
}

export function usePerpsMetas({ category, keyword }: Options) {
    const { infoClient } = useHyperliquid();

    const {
        data: perpsMetas,
        isLoading: isPerpsMetasLoading,
        error,
    } = useQuery({
        queryKey: ['perps', 'metas'],
        staleTime: STALE_TIMES.HOUR_1,
        queryFn: () => infoClient.allPerpMetas(),
    });
    const {
        data: perpsMids,
        isLoading: isPerpsMidsLoading,
        error: perpsMidsError,
    } = useQuery({
        queryKey: ['perps', 'mids'],
        staleTime: STALE_TIMES.MINUTE_1,
        queryFn: () => infoClient.allMids(),
    });
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
        const universe = perpsMetas?.flatMap((x) => x.universe) || [];
        if (!universe?.length || !category) return [];

        const filteredIds = perpsMetaIds?.filter((meta) => meta.category_name === category).map((meta) => meta.name);
        const filteredMetas = searchMetas(
            category === 'all'
                ? universe
                : universe.filter((meta) => filteredIds?.some((id) => id.toLowerCase() === meta.name.toLowerCase())),
            keyword,
        );
        return filteredMetas.map((meta) => {
            const [dex, name] = meta.name.split(':');

            return {
                ...meta,
                dex: name ? dex : undefined,
                name: name || meta.name,
                avatar: resolveMetaAvatar(meta.name),
                mid: perpsMids?.[meta.name] || perpsMids?.[name || ''],
            };
        });
    }, [perpsMetas, perpsMids, perpsMetaIds, keyword, category]);

    return {
        data: perpsList,
        error: error || perpsMidsError || perpsMetaIdsError,
        isLoading: isPerpsMetaIdsLoading,
        isGlobalLoading: isPerpsMetasLoading || isPerpsMidsLoading,
    };
}
