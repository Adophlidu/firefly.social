import { POLYMARKET_DATA_API_ROOT_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';

function normalizePath(pathSegments: string | undefined) {
    if (!pathSegments) return '';
    return pathSegments
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}

async function proxy(request: Request, splatPath: string | undefined) {
    const upstreamUrl = new URL(`${POLYMARKET_DATA_API_ROOT_URL}/${normalizePath(splatPath)}`);

    new URL(request.url).searchParams.forEach((value, key) => {
        upstreamUrl.searchParams.append(key, value);
    });

    const upstreamResponse = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
        redirect: 'follow',
    });

    const headers = new Headers(upstreamResponse.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.set('Cache-Control', 'no-store');

    return new Response(await upstreamResponse.arrayBuffer(), {
        status: upstreamResponse.status,
        headers,
    });
}

export function GET({ request, params }: ApiContext) {
    return proxy(request, params['*']);
}
