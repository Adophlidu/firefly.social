import type { CustomTokenType } from '@dimensiondev/enums';
import type { Address } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createPersistStorage } from '@/helpers/createPersistStorage.js';

interface ERC20Token {
    type: CustomTokenType.ERC20;
    logoURI: string;
    chainId: number;
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
}

export type CustomToken = ERC20Token;

type TokenIndex = Pick<CustomToken, 'chainId' | 'address' | 'type'>;

interface CustomTokensStore {
    tokens: Record<string, CustomToken>;
    size: () => number;
    addToken: (token: CustomToken) => void;
    removeToken: (token: TokenIndex) => void;
    hasToken: (token: CustomToken) => boolean;
    getToken: (token: TokenIndex) => CustomToken | undefined;
}

type CustomTokensStorableStore = Pick<CustomTokensStore, 'tokens'>;

function generateTokenKey(token: TokenIndex) {
    return `${token.type}:${token.chainId}:${token.address}`;
}

export const useCustomTokenStore = create<CustomTokensStore, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set, get) => ({
            tokens: {},
            size() {
                const state = get();
                return Object.keys(state.tokens).length;
            },
            addToken(token) {
                set((state) => {
                    const key = generateTokenKey(token);
                    if (!key) return;
                    state.tokens[key] = token;
                });
            },
            removeToken(tokenIndex) {
                set((state) => {
                    const key = generateTokenKey(tokenIndex);
                    if (!key) return;
                    delete state.tokens[key];
                });
            },
            hasToken(tokenIndex) {
                const state = get();
                const key = generateTokenKey(tokenIndex);
                if (!key) return false;
                return key in state.tokens;
            },
            getToken(tokenIndex: TokenIndex) {
                const state = get();
                const key = generateTokenKey(tokenIndex);
                if (!key) return;
                return state.tokens[key];
            },
        })),
        {
            storage: createPersistStorage<CustomTokensStorableStore>('custom-tokens'),
            partialize: (state) => ({ tokens: state.tokens }),
            name: 'custom-tokens',
        },
    ),
);
