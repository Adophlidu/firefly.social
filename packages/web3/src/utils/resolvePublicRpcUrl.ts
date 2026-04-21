import { chains } from '@/chains/eth.js';

type RpcUrlOverrides = Readonly<Partial<Record<number, string | null | undefined>>>;

export function resolvePublicRpcUrl(chainId: number, overrides?: RpcUrlOverrides): string | undefined {
    const override = overrides?.[chainId];
    if (override) return override;
    return chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
}
