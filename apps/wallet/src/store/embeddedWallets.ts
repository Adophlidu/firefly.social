import { atom } from 'jotai';
import { mainnet } from 'viem/chains';

import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

export const showEmbeddedWalletUIAtom = atom(true);

export const chainIdAtom = atom<number>(mainnet.id);

const baseEvmWalletAddressAtom = atom<string | null>(null);
const baseSolanaWalletAddressAtom = atom<string | null>(null);

export const evmWalletAddressAtom = atom(
    (get) => {
        const token = get(fireflySessionTokenAtom);
        if (!token) return null;

        return get(baseEvmWalletAddressAtom);
    },
    (get, set, newAddress: string | null) => {
        const token = get(fireflySessionTokenAtom);
        set(baseEvmWalletAddressAtom, token ? newAddress : null);
    },
);
export const solanaWalletAddressAtom = atom(
    (get) => {
        const token = get(fireflySessionTokenAtom);
        if (!token) return null;

        return get(baseSolanaWalletAddressAtom);
    },
    (get, set, newAddress: string | null) => {
        const token = get(fireflySessionTokenAtom);
        set(baseSolanaWalletAddressAtom, token ? newAddress : null);
    },
);

export const isWalletAuthorizedAtom = atom((get) => !!get(evmWalletAddressAtom) && !!get(solanaWalletAddressAtom));
