import { chains } from '@/chains/eth.js';

type RpcUrlOverrides = Readonly<Partial<Record<number, string | null | undefined>>>;

// Build-time env vars inlined by Next.js / Vite define
const registeredRpcUrls = new Map<number, string>(
    [
        [1, process.env.NEXT_PUBLIC_MAINNET_RPC_URL!], // mainnet
        [10, process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL!], // optimism
        [137, process.env.NEXT_PUBLIC_POLYGON_RPC_URL!], // polygon
    ].filter((entry): entry is [number, string] => !!entry[1]),
);

export function resolvePublicRpcUrl(chainId: number, overrides?: RpcUrlOverrides): string | undefined {
    const override = overrides?.[chainId];
    if (override) return override;
    const registered = registeredRpcUrls.get(chainId);
    if (registered) return registered;
    return chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
}
