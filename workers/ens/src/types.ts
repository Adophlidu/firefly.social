import type { Context as HonoContext } from 'hono';

export interface Provider<ChainId> {
    id: string;
    lookup(chainId: ChainId, domain: string, c: HonoContext): Promise<string | undefined>;
    reverse(chainId: ChainId, address: string, c: HonoContext): Promise<string | undefined>;
}

export type Context = HonoContext<{ Bindings: { KV: KVNamespace } }>;
