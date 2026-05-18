import { CustomTokenType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { produce } from 'immer';
import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import type { Address } from 'viem';

import { createPersistStorage } from '@/helpers/createPersistStorage.js';

export interface ERC20Token {
    type: CustomTokenType.ERC20;
    logoURI: string;
    chainId: number;
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
}

export interface ERC721Token {
    type: CustomTokenType.ERC721;
    chainId: number;
    address: Address;
    name: string;
}

export type CustomToken = ERC20Token | ERC721Token;

export type TokenIndex = Pick<CustomToken, 'chainId' | 'address' | 'type'>;

interface CustomTokensStorableStore {
    state: {
        tokens: Record<string, CustomToken>;
    };
    version: number;
}

function generateTokenKey(token: TokenIndex): string | null {
    const type = token.type;
    switch (type) {
        case CustomTokenType.ERC20:
            return `${type}:${token.chainId}:${token.address}`;
        case CustomTokenType.ERC721:
            return `${type}:${token.chainId}:${token.address}`;
        default:
            safeUnreachable(type);
            return null;
    }
}

const customTokensStorageAtom = atomWithStorage<CustomTokensStorableStore>(
    'custom-tokens',
    { state: { tokens: {} }, version: 0 },
    createPersistStorage('custom-tokens'),
    {
        getOnInit: true,
    },
);

export const customTokensAtom = atom(async (get) => {
    const state = await get(customTokensStorageAtom);
    if (!state || (typeof state === 'object' && 'then' in state)) {
        return [];
    }
    return Object.values(state.state.tokens);
});

// Read-side wrapper: underlying storage is async (localforage), so reading
// customTokensAtom directly suspends. Unwrap returns a sync fallback instead.
export const customTokensUnwrappedAtom = unwrap(customTokensAtom, (prev) => prev ?? []);

export const addCustomTokenAtom = atom(null, async (get, set, token: CustomToken) => {
    const key = generateTokenKey(token);
    if (!key) return;
    const currentState = await get(customTokensStorageAtom);
    const newState = produce(currentState, (draft) => {
        draft.state.tokens[key] = token;
    });
    await set(customTokensStorageAtom, newState);
});
