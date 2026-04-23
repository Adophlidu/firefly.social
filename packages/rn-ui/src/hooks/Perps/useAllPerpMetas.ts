import { useAtomValue } from 'jotai';

import { allMetaAtom } from '@/store/meta';

export function useAllPerpMetas() {
    const allMeta = useAtomValue(allMetaAtom);

    if (allMeta.status === 'loading' || allMeta.status === 'error')
        return {
            data: [],
            isLoading: true,
        };

    return {
        data: allMeta.data,
        isLoading: !allMeta.data.length,
    };
}
