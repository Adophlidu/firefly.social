import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import type { SelectTokenSearch } from '@/providers/swap/types.js';

export function useGoToSelectToken({ side, from }: SelectTokenSearch) {
    const navigate = useNavigate();

    return useCallback(() => {
        navigate({
            to: '/swap/select-token',
            search: { side, from },
            replace: true,
        });
    }, [navigate, side, from]);
}
