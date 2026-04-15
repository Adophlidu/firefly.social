import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { atom } from 'jotai';

import { DEFAULT_SWAP_TOKENS, getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';

// Access path for analytics
export enum SwapAccessPath {
    TokenDetail = '1', // External access from token detail
    WalletGUI = '2', // Internal wallet GUI access (default)
    CopyTrade = '3', // External access from copy trade
}
export const accessPathAtom = atom<SwapAccessPath>(SwapAccessPath.WalletGUI); // Default to Wallet GUI

// External wallet addresses passed from mask.social (for wallet filter default selection)
export const externalEvmAddressAtom = atom<string | null>(null);
export const externalSolanaAddressAtom = atom<string | null>(null);

// Selected wallet address overrides (for wallet filter)
export const selectedPayWalletAtom = atom<string | null>(null);
export const selectedReceiveWalletAtom = atom<string | null>(null);

/** Internal swap entry: embedded-only filter + clear external overrides */
export const resetSwapWalletContext = atom(null, (_, set) => {
    set(accessPathAtom, SwapAccessPath.WalletGUI);
    set(externalEvmAddressAtom, null);
    set(externalSolanaAddressAtom, null);
    set(selectedPayWalletAtom, null);
    set(selectedReceiveWalletAtom, null);
});

const defaultPair = DEFAULT_SWAP_TOKENS.find((t) => t.chainId === 1)!;

// Trading pair state (address + chain are the source of truth; tokens are derived via useResolvedSwapTokens)
export const fromAddressAtom = atom<string | null>(defaultPair.first.contractAddress);
export const toAddressAtom = atom<string | null>(defaultPair.second.contractAddress);
export const fromAmountAtom = atom<string>('');

// Chain selection (default to Ethereum mainnet)
export const fromChainIdAtom = atom<number | null>(1);
export const toChainIdAtom = atom<number | null>(1);

// Derived atom for cross-chain detection
export const isCrossChainAtom = atom((get) => {
    const from = get(fromChainIdAtom) || 1;
    const to = get(toChainIdAtom) || 1;
    return from !== to;
});

// UI state
export type SwapStep = 'input' | 'review' | 'processing';
export const swapStepAtom = atom<SwapStep>('input');

// Action: Swap tokens (flip from/to)
export const swapTokensAtom = atom(null, (get, set) => {
    const fromChain = get(fromChainIdAtom);
    const toChain = get(toChainIdAtom);

    // Resolve chains using the same logic as useResolvedSwapTokens
    const resolvedFromChain = fromChain ?? 1;
    const resolvedToChain = toChain ?? resolvedFromChain;

    // Resolve addresses using defaults (same as useResolvedSwapTokens)
    const fromDefaults = getDefaultSwapToken(resolvedFromChain);
    const toDefaults = getDefaultSwapToken(resolvedToChain);
    const fromAddr = get(fromAddressAtom) ?? fromDefaults?.first.contractAddress ?? null;
    const toAddr = get(toAddressAtom) ?? toDefaults?.second.contractAddress ?? null;

    const payWallet = get(selectedPayWalletAtom);
    const receiveWallet = get(selectedReceiveWalletAtom);

    set(fromAddressAtom, toAddr);
    set(toAddressAtom, fromAddr);
    set(fromChainIdAtom, resolvedToChain);
    set(toChainIdAtom, resolvedFromChain);

    // Safety: if both sides end up being the same token after flip, auto-switch "to"
    if (resolvedToChain === resolvedFromChain && toAddr && fromAddr && isNativeTokenOrSameAddress(toAddr, fromAddr)) {
        const counterpart = getCounterpartAddress(resolvedToChain, toAddr);
        if (counterpart) set(toAddressAtom, counterpart);
    }

    set(fromAmountAtom, '');
    set(selectedPayWalletAtom, receiveWallet);
    set(selectedReceiveWalletAtom, payWallet);
});

/** Find the complementary default token address for a given token on a chain */
function getCounterpartAddress(chainId: number, address: string): string | null {
    const defaults = getDefaultSwapToken(chainId);
    if (!defaults) return null;
    if (isNativeTokenOrSameAddress(address, defaults.first.contractAddress)) return defaults.second.contractAddress;
    if (isNativeTokenOrSameAddress(address, defaults.second.contractAddress)) return defaults.first.contractAddress;
    return defaults.first.contractAddress;
}

/** Set the "from" token with automatic conflict resolution: if it matches "to", switch "to" to the counterpart */
export const setFromTokenAtom = atom(null, (get, set, { address, chainId }: { address: string; chainId: number }) => {
    set(fromAddressAtom, address);
    set(fromChainIdAtom, chainId);
    const toChain = get(toChainIdAtom);
    const toAddr = get(toAddressAtom);
    if (chainId === toChain && toAddr && isNativeTokenOrSameAddress(address, toAddr)) {
        const counterpart = getCounterpartAddress(chainId, address);
        if (counterpart) set(toAddressAtom, counterpart);
    }
});

/** Set the "to" token with automatic conflict resolution: if it matches "from", switch "from" to the counterpart */
export const setToTokenAtom = atom(null, (get, set, { address, chainId }: { address: string; chainId: number }) => {
    set(toAddressAtom, address);
    set(toChainIdAtom, chainId);
    const fromChain = get(fromChainIdAtom);
    const fromAddr = get(fromAddressAtom);
    if (chainId === fromChain && fromAddr && isNativeTokenOrSameAddress(address, fromAddr)) {
        const counterpart = getCounterpartAddress(chainId, address);
        if (counterpart) {
            set(fromAddressAtom, counterpart);
            set(fromAmountAtom, '');
        }
    }
});
