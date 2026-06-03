import { POLYMARKET_DATA_API_ROOT_URL } from '@dimensiondev/constants/static';
import type { NextRequest } from 'next/server.js';

export const runtime = 'edge';

interface RouteContext {
    params: Promise<{
        path?: string[];
    }>;
}

function normalizePath(pathSegments: string[] | undefined) {
    return (pathSegments ?? []).map((segment) => encodeURIComponent(segment)).join('/');
}

async function proxy(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    const upstreamUrl = new URL(`${POLYMARKET_DATA_API_ROOT_URL}/${normalizePath(path)}`);

    request.nextUrl.searchParams.forEach((value, key) => {
        upstreamUrl.searchParams.append(key, value);
    });

    const upstreamResponse = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
        cache: 'no-store',
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

export async function GET(request: NextRequest, context: RouteContext) {
    return proxy(request, context);
}
