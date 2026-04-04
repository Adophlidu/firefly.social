import { pick } from 'lodash-es';
import { useCallback } from 'react';

import { type SearchTokenInfo } from '@/providers/types/Firefly.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function useTokenCoin(symbol: string | undefined) {
    const { preferences, setPreference } = usePreferencesState();
    const coin = symbol ? preferences.TOKEN_PROFILE_COIN_ID_MAP[symbol.toLowerCase()] : undefined;
    const setCoin = useCallback(
        (key: string, coin: Pick<SearchTokenInfo, 'id' | 'chain' | 'contract_address'>) => {
            setPreference('TOKEN_PROFILE_COIN_ID_MAP', (map) => ({
                ...map,
                [key.toLowerCase()]: pick(coin, ['id', 'chain', 'contract_address']),
            }));
        },
        [setPreference],
    );
    return [coin, setCoin] as const;
}
