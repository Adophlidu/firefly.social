import { chains } from '@/chains/eth.js';

type RpcUrlOverrides = Readonly<Partial<Record<number, string | null | undefined>>>;

const HARDCODED_RPC_URLS: Record<number, string> = {
    1: 'https://thrumming-flashy-replica.quiknode.pro/a5385e01c5d86056ee9c58742ad2a42d78f77e7a',
    10: 'https://thrumming-flashy-replica.optimism.quiknode.pro/a5385e01c5d86056ee9c58742ad2a42d78f77e7a',
    137: 'https://thrumming-flashy-replica.matic.quiknode.pro/a5385e01c5d86056ee9c58742ad2a42d78f77e7a',
};

export function resolvePublicRpcUrl(chainId: number, overrides?: RpcUrlOverrides): string | undefined {
    const override = overrides?.[chainId];
    if (override) return override;
    const hardcoded = HARDCODED_RPC_URLS[chainId];
    if (hardcoded) return hardcoded;
    return chains.find((x) => x.id === chainId)?.rpcUrls.default.http[0];
}
