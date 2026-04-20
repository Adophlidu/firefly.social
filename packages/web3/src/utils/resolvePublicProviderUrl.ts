import { chains } from '@/chains/eth.js';

type ResolvePublicProviderUrlRpcOverrides = Readonly<Partial<Record<number, string | null | undefined>>>;

/**
 * Resolves an HTTP RPC URL for a chain. Optional per-chain overrides (e.g. env) are checked first,
 * then viem `chains` defaults.
 */
export function resolvePublicProviderUrl(chainId: number, rpcUrlOverrides?: ResolvePublicProviderUrlRpcOverrides) {
    const overridden = rpcUrlOverrides?.[chainId];
    if (overridden) return overridden;
    const rpc = chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
    if (!rpc) {
        throw new Error(`Chain ${chainId} not found`);
    }
    return rpc;
}
