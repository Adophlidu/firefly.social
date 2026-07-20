import type { ApiContext } from '@dimensiondev/ssr';

export function GET({ url }: ApiContext) {
    return Response.json({ ok: true, path: url.pathname });
}

export function POST() {
    return 'created';
}
