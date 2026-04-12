import { safeUnreachable } from '@dimensiondev/utils';
import { produce } from 'immer';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Address } from 'viem';

import type { EthereumChainId } from '@/constants/ethereum.js';
import { createPersistStorage } from '@/helpers/createPersistStorage.js';

export enum CustomTokenType {
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
}

export interface ERC20Token {
    type: CustomTokenType.ERC20;
    logoURI: string;
    chainId: EthereumChainId;
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
}

export interface ERC721Token {
    type: CustomTokenType.ERC721;
    chainId: EthereumChainId;
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

export const addCustomTokenAtom = atom(null, async (get, set, token: CustomToken) => {
    const key = generateTokenKey(token);
    if (!key) return;
    const currentState = await get(customTokensStorageAtom);
    const newState = produce(currentState, (draft) => {
        draft.state.tokens[key] = token;
    });
    await set(customTokensStorageAtom, newState);
});
