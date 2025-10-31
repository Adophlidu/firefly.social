import { safeUnreachable } from '@firefly/utils';
import type { Address } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createPersistStorage } from '@/helpers/createPersistStorage.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

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

interface CustomTokensStore {
    tokens: Record<string, CustomToken>;
    size: () => number;
    addToken: (token: CustomToken) => void;
    removeToken: (token: TokenIndex) => void;
    hasToken: (token: CustomToken) => boolean;
    getToken: (token: TokenIndex) => CustomToken | undefined;
}

export type CustomTokensStorableStore = Pick<CustomTokensStore, 'tokens'>;

function generateTokenKey(token: TokenIndex) {
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
