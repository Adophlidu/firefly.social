import { useNavigate } from '@dimensiondev/ssr';
import { useCallback } from 'react';

import { stringifySearch } from '@/helpers/searchParams.js';
import type { SelectTokenSearch } from '@/providers/swap/types.js';

export function useGoToSelectToken({ side, from }: SelectTokenSearch) {
    const navigate = useNavigate();

    return useCallback(() => {
        navigate(`/swap/select-token${stringifySearch({ side, from })}`, { replace: true });
    }, [navigate, side, from]);
}
