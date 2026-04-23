import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { allDexsClearinghouseStateAtom } from '@/store/websocket';
import type { Position } from '@/types/ui';

export function useActivePositions() {
    const clearinghouseState = useAtomValue(allDexsClearinghouseStateAtom);

    return useMemo<Position[]>(() => {
        if (!clearinghouseState.length) return [];

        const allState = clearinghouseState.flatMap(([_, state]) => state.assetPositions);
        return allState.map((state) => state.position);
    }, [clearinghouseState]);
}
