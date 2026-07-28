import type { ApiContext } from '@dimensiondev/ssr';

export function GET({ env }: ApiContext) {
    return Response.json({ envKeys: env ? Object.keys(env) : null, hasAssets: Boolean(env && (env as { ASSETS?: unknown }).ASSETS) });
}
